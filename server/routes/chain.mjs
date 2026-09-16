import { Router } from 'express';
import { createPublicClient, http, parseAbiItem, formatUnits } from 'viem';
import {
  REXI_NETWORK,
  REXI_LAUNCHPAD,
  REXI_SUPERSEDED_DEPLOYMENTS,
  rewardAssetByAddress,
  explorerAddressUrl,
  explorerTxUrl
} from '../../src/services/deployments.js';

const router = Router();
const canonicalLaunchpad = process.env.REXI_LAUNCHPAD_TESTNET || REXI_LAUNCHPAD;
const rpcUrl = process.env.RH_RPC_URL || REXI_NETWORK.rpcUrl;
const client = createPublicClient({ transport: http(rpcUrl) });

/**
 * Every launchpad that has ever been canonical, so launches on superseded
 * deployments stay visible and claimable instead of being orphaned by a
 * rotation. Superseded pads are marked `legacy: true` in the index.
 */
const launchpads = [
  canonicalLaunchpad,
  ...REXI_SUPERSEDED_DEPLOYMENTS.map(d => d.address)
].filter((address, i, all) => all.findIndex(a => a.toLowerCase() === address.toLowerCase()) === i);

const launchCreated = parseAbiItem('event LaunchCreated(address indexed token,address indexed rewardAsset,address indexed creator,uint256 supply)');
const rewardsDistributed = parseAbiItem('event RewardsDistributed(address indexed token,uint256 amount,uint256 holderAmount)');
const rewardClaimed = parseAbiItem('event RewardClaimed(address indexed token,address indexed holder,uint256 amount)');

const launchAbi = parseAbiItem('function launches(address token) view returns (address token,address rewardAsset,uint256 accRewardPerToken,uint256 rewardBalance,bool active)');
const nameAbi = parseAbiItem('function name() view returns (string)');
const symbolAbi = parseAbiItem('function symbol() view returns (string)');
const decimalsAbi = parseAbiItem('function decimals() view returns (uint8)');
const totalSupplyAbi = parseAbiItem('function totalSupply() view returns (uint256)');
const balanceOfAbi = parseAbiItem('function balanceOf(address account) view returns (uint256)');

const CACHE_TTL_MS = 15000;
const indexCache = new Map();

/** Reads the ERC-20 metadata a RexiToken exposes; returns nulls if a call fails. */
async function readTokenMetadata(token, launchpadAddress) {
  const [name, symbol, decimals, totalSupply, launch] = await Promise.all([
    client.readContract({ address: token, abi: [nameAbi], functionName: 'name' }).catch(() => null),
    client.readContract({ address: token, abi: [symbolAbi], functionName: 'symbol' }).catch(() => null),
    client.readContract({ address: token, abi: [decimalsAbi], functionName: 'decimals' }).catch(() => 18),
    client.readContract({ address: token, abi: [totalSupplyAbi], functionName: 'totalSupply' }).catch(() => null),
    client.readContract({ address: launchpadAddress, abi: [launchAbi], functionName: 'launches', args: [token] }).catch(() => null)
  ]);
  const decimalsValue = Number(decimals ?? 18);
  return {
    name,
    symbol,
    decimals: decimalsValue,
    totalSupply: totalSupply?.toString() ?? null,
    totalSupplyFormatted: totalSupply != null ? formatUnits(totalSupply, decimalsValue) : null,
    rewardAsset: launch?.[1] ?? null,
    accRewardPerToken: launch?.[2]?.toString() ?? null,
    rewardBalance: launch?.[3]?.toString() ?? null,
    rewardBalanceFormatted: launch?.[3] != null ? formatUnits(launch[3], 18) : null,
    active: launch?.[4] ?? null
  };
}

/** Formats a raw reward amount using the reward asset's decimals (Rexi test assets use 18). */
function formatReward(value, rewardAsset) {
  const decimals = rewardAssetByAddress(rewardAsset)?.decimals ?? 18;
  return formatUnits(value ?? 0n, decimals);
}

/** Resolves block timestamps for a small set of logs. */
async function timestampsFor(logs) {
  const unique = [...new Set(logs.map(l => l.blockNumber).filter(Boolean))];
  const entries = await Promise.all(unique.map(async (blockNumber) => {
    const block = await client.getBlock({ blockNumber }).catch(() => null);
    return [blockNumber.toString(), block?.timestamp ? Number(block.timestamp) : null];
  }));
  return Object.fromEntries(entries);
}

function relativeTime(seconds) {
  if (seconds == null) return null;
  const delta = Math.max(0, Math.floor(Date.now() / 1000) - seconds);
  if (delta < 60) return `${delta}s ago`;
  if (delta < 3600) return `${Math.floor(delta / 60)}m ago`;
  if (delta < 86400) return `${Math.floor(delta / 3600)}h ago`;
  return `${Math.floor(delta / 86400)}d ago`;
}

/**
 * Indexes every LaunchCreated / RewardsDistributed / RewardClaimed event of one
 * launchpad and joins it with live contract state.
 */
async function buildIndex(launchpadAddress) {
  const legacy = launchpadAddress.toLowerCase() !== canonicalLaunchpad.toLowerCase();
  const [createdLogs, distributedLogs, claimedLogs] = await Promise.all([
    // This RPC rejects the `earliest` keyword and needs a hex quantity, so scan from block 0.
    client.getLogs({ address: launchpadAddress, event: launchCreated, fromBlock: 0n, toBlock: 'latest' }),
    client.getLogs({ address: launchpadAddress, event: rewardsDistributed, fromBlock: 0n, toBlock: 'latest' }),
    client.getLogs({ address: launchpadAddress, event: rewardClaimed, fromBlock: 0n, toBlock: 'latest' })
  ]);

  const byToken = new Map();
  for (const token of new Set(createdLogs.map(l => l.args.token))) {
    byToken.set(token, { distributions: [], claims: [] });
  }
  for (const log of distributedLogs) byToken.get(log.args.token)?.distributions.push(log);
  for (const log of claimedLogs) byToken.get(log.args.token)?.claims.push(log);

  const launches = await Promise.all(createdLogs.map(async (log) => {
    const { token, rewardAsset, creator, supply } = log.args;
    const bucket = byToken.get(token) || { distributions: [], claims: [] };
    const metadata = await readTokenMetadata(token, launchpadAddress);
    const distributedRaw = bucket.distributions.reduce((sum, l) => sum + l.args.amount, 0n);
    const holderShareRaw = bucket.distributions.reduce((sum, l) => sum + l.args.holderAmount, 0n);
    const claimedRaw = bucket.claims.reduce((sum, l) => sum + l.args.amount, 0n);
    const asset = rewardAssetByAddress(rewardAsset);
    const decimalsValue = metadata.decimals ?? 18;
    return {
      token,
      tokenUrl: explorerAddressUrl(token),
      name: metadata.name,
      symbol: metadata.symbol,
      decimals: decimalsValue,
      totalSupply: metadata.totalSupply ?? supply?.toString() ?? null,
      supply: supply?.toString() ?? null,
      supplyFormatted: supply != null ? formatUnits(supply, decimalsValue) : null,
      rewardAsset,
      rewardAssetSymbol: asset?.symbol ?? null,
      rewardAssetName: asset?.name ?? null,
      rewardAssetIsTestToken: asset?.testnetOnly ?? true,
      rewardBalance: metadata.rewardBalance,
      rewardBalanceRaw: metadata.rewardBalance,
      rewardBalanceFormatted: metadata.rewardBalanceFormatted,
      rewardBalanceAmount: formatReward(metadata.rewardBalance, rewardAsset),
      accRewardPerToken: metadata.accRewardPerToken,
      active: metadata.active,
      creator,
      launchpad: launchpadAddress,
      launchpadUrl: explorerAddressUrl(launchpadAddress),
      legacy,
      txHash: log.transactionHash,
      transactionHash: log.transactionHash,
      txUrl: explorerTxUrl(log.transactionHash),
      blockNumber: log.blockNumber?.toString() ?? null,
      distributionCount: bucket.distributions.length,
      distributedRaw: distributedRaw.toString(),
      distributed: formatReward(distributedRaw, rewardAsset),
      holderShare: formatReward(holderShareRaw, rewardAsset),
      holderShareRaw: holderShareRaw.toString(),
      claimedRaw: claimedRaw.toString(),
      distributeTx: bucket.distributions.at(-1)?.transactionHash ?? null,
      claimCount: bucket.claims.length,
      claimed: formatReward(claimedRaw, rewardAsset),
      lastDistributionBlock: bucket.distributions.at(-1)?.blockNumber?.toString() ?? null
    };
  }));

  launches.sort((a, b) => Number(b.blockNumber ?? 0) - Number(a.blockNumber ?? 0));

  const recentLogs = distributedLogs.slice(-8).reverse();
  const stamps = await timestampsFor(recentLogs);
  const recentDistributions = recentLogs.map((log) => {
    const launch = launches.find(l => l.token === log.args.token);
    const stamp = stamps[log.blockNumber?.toString()];
    return {
      token: log.args.token,
      symbol: launch?.symbol ?? null,
      name: launch?.name ?? null,
      amount: formatReward(log.args.amount, launch?.rewardAsset),
      holderAmount: formatReward(log.args.holderAmount, launch?.rewardAsset),
      rewardAssetSymbol: launch?.rewardAssetSymbol ?? null,
      launchpad: launchpadAddress,
      legacy,
      txHash: log.transactionHash,
      txUrl: explorerTxUrl(log.transactionHash),
      blockNumber: log.blockNumber?.toString() ?? null,
      timestamp: stamp ?? null,
      ago: relativeTime(stamp)
    };
  });

  return {
    launchpad: launchpadAddress,
    launchpadUrl: explorerAddressUrl(launchpadAddress),
    legacy,
    launches,
    distributedLogs,
    claimedLogs,
    recentDistributions
  };
}

async function cachedIndexFor(launchpadAddress) {
  const key = launchpadAddress.toLowerCase();
  const hit = indexCache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.payload;
  const payload = await buildIndex(launchpadAddress);
  indexCache.set(key, { at: Date.now(), payload });
  return payload;
}

/** Merges every indexed launchpad into one view, newest blocks first. */
async function mergedIndex() {
  const indexes = await Promise.all(launchpads.map(pad => cachedIndexFor(pad)));
  const launches = indexes
    .flatMap(index => index.launches)
    .sort((a, b) => Number(b.blockNumber ?? 0) - Number(a.blockNumber ?? 0));
  const recentDistributions = indexes
    .flatMap(index => index.recentDistributions)
    .sort((a, b) => Number(b.blockNumber ?? 0) - Number(a.blockNumber ?? 0))
    .slice(0, 8);
  const symbols = [...new Set(launches.map(l => l.rewardAssetSymbol).filter(Boolean))];
  const stats = {
    chainId: REXI_NETWORK.chainIdDecimal,
    launchpad: canonicalLaunchpad,
    launchpads,
    legacyLaunchpads: launchpads.length - 1,
    explorer: REXI_NETWORK.blockExplorerUrl,
    launchCount: launches.length,
    legacyLaunchCount: launches.filter(l => l.legacy).length,
    distributions: indexes.reduce((sum, i) => sum + i.distributedLogs.length, 0),
    payingTokens: launches.filter(l => l.distributionCount > 0).length,
    holderPayouts: indexes.reduce((sum, i) => sum + i.claimedLogs.length, 0),
    distributedByAsset: symbols.map(symbol => ({
      symbol,
      total: launches
        .filter(l => l.rewardAssetSymbol === symbol)
        .reduce((sum, l) => sum + Number(l.distributed), 0)
        .toFixed(2)
    })),
    generatedAt: new Date().toISOString()
  };

  return {
    success: true,
    chainId: REXI_NETWORK.chainIdDecimal,
    launchpad: canonicalLaunchpad,
    launchpadUrl: explorerAddressUrl(canonicalLaunchpad),
    explorer: REXI_NETWORK.blockExplorerUrl,
    generatedAt: stats.generatedAt,
    stats,
    data: launches,
    recentDistributions,
    topLaunches: [...launches].sort((a, b) => Number(b.distributedRaw) - Number(a.distributedRaw)).slice(0, 8)
  };
}

/**
 * Solvency audit for every indexed launchpad. Two invariants are checked:
 *   1. per launch: rewardBalance == Σ holderAmounts(distributions) − Σ claims
 *   2. per reward asset: contract balance >= the sum of every bucket it backs
 */
async function buildHealth() {
  const indexes = await Promise.all(launchpads.map(pad => cachedIndexFor(pad)));
  const launches = [];
  const assets = new Map();

  for (const index of indexes) {
    for (const launch of index.launches) {
      const expected = BigInt(launch.holderShareRaw) - BigInt(launch.claimedRaw);
      const onChain = BigInt(launch.rewardBalanceRaw ?? '0');
      const drift = onChain - expected;
      launches.push({
        launchpad: index.launchpad,
        legacy: index.legacy,
        token: launch.token,
        symbol: launch.symbol,
        rewardAsset: launch.rewardAsset,
        rewardAssetSymbol: launch.rewardAssetSymbol,
        expectedBucket: expected.toString(),
        onChainBucket: onChain.toString(),
        drift: drift.toString(),
        driftFormatted: formatReward(drift < 0n ? -drift : drift, launch.rewardAsset),
        healthy: drift === 0n
      });
      const assetKey = `${index.launchpad}:${launch.rewardAsset}`;
      const entry = assets.get(assetKey) || {
        launchpad: index.launchpad,
        legacy: index.legacy,
        asset: launch.rewardAsset,
        symbol: launch.rewardAssetSymbol,
        buckets: 0n // accumulator only; never serialized
      };
      entry.buckets += onChain;
      assets.set(assetKey, entry);
    }
  }

  await Promise.all([...assets.values()].map(async (entry) => {
    const raw = await client
      .readContract({ address: entry.asset, abi: [balanceOfAbi], functionName: 'balanceOf', args: [entry.launchpad] })
      .catch(() => null);
    entry.contractBalanceRaw = raw != null ? raw.toString() : null;
    entry.contractBalance = raw != null ? formatReward(raw, entry.asset) : null;
    entry.bucketTotal = formatReward(entry.buckets, entry.asset);
    if (raw == null) {
      entry.surplus = null;
      entry.surplusFormatted = null;
      entry.solvency = 'unknown';
      return;
    }
    const surplus = raw - entry.buckets;
    entry.surplus = surplus.toString();
    entry.surplusFormatted = formatReward(surplus < 0n ? -surplus : surplus, entry.asset);
    entry.solvency = surplus >= 0n ? 'ok' : 'insolvent';
  }));

  // Emit plain fields only, so the BigInt accumulator never reaches JSON.
  const assetChecks = [...assets.values()].map((entry) => ({
    launchpad: entry.launchpad,
    legacy: entry.legacy,
    asset: entry.asset,
    symbol: entry.symbol,
    bucketTotal: entry.bucketTotal,
    contractBalanceRaw: entry.contractBalanceRaw,
    contractBalance: entry.contractBalance,
    surplus: entry.surplus,
    surplusFormatted: entry.surplusFormatted,
    solvency: entry.solvency
  }));
  const bucketDrift = launches.filter(l => !l.healthy);
  const insolvent = assetChecks.filter(a => a.solvency === 'insolvent');
  return {
    success: true,
    chainId: REXI_NETWORK.chainIdDecimal,
    launchpads,
    generatedAt: new Date().toISOString(),
    status: bucketDrift.length === 0 && insolvent.length === 0 ? 'ok' : 'drift',
    summary: {
      launchesChecked: launches.length,
      launchesWithBucketDrift: bucketDrift.length,
      assetsChecked: assetChecks.length,
      insolventAssets: insolvent.length
    },
    launches,
    assets: assetChecks
  };
}

router.get('/launches', async (_req, res) => {
  try {
    res.json(await mergedIndex());
  } catch (error) {
    res.status(502).json({ success: false, error: 'Robinhood Chain RPC unavailable', detail: error.message });
  }
});

router.get('/launches/:token', async (req, res) => {
  try {
    const index = await mergedIndex();
    const launch = index.data.find(l => l.token.toLowerCase() === String(req.params.token).toLowerCase());
    if (!launch) {
      return res.status(404).json({ success: false, error: 'Launch not found on any indexed launchpad' });
    }
    res.json({
      success: true,
      chainId: index.chainId,
      launchpad: launch.launchpad,
      data: {
        ...launch,
        distributions: index.recentDistributions.filter(d => d.token === launch.token)
      }
    });
  } catch (error) {
    res.status(502).json({ success: false, error: 'Robinhood Chain RPC unavailable', detail: error.message });
  }
});

router.get('/health', async (_req, res) => {
  try {
    const health = await buildHealth();
    res.status(health.status === 'ok' ? 200 : 503).json(health);
  } catch (error) {
    res.status(502).json({ success: false, error: 'Robinhood Chain RPC unavailable', detail: error.message });
  }
});

export default router;