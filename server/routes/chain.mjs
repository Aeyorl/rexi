import { Router } from 'express';
import { createPublicClient, http, parseAbiItem, formatUnits } from 'viem';
import {
  REXI_NETWORK,
  REXI_LAUNCHPAD,
  rewardAssetByAddress,
  explorerAddressUrl,
  explorerTxUrl
} from '../../src/services/deployments.js';

const router = Router();
const launchpad = process.env.REXI_LAUNCHPAD_TESTNET || REXI_LAUNCHPAD;
const rpcUrl = process.env.RH_RPC_URL || REXI_NETWORK.rpcUrl;
const client = createPublicClient({ transport: http(rpcUrl) });

const launchCreated = parseAbiItem('event LaunchCreated(address indexed token,address indexed rewardAsset,address indexed creator,uint256 supply)');
const rewardsDistributed = parseAbiItem('event RewardsDistributed(address indexed token,uint256 amount,uint256 holderAmount)');
const rewardClaimed = parseAbiItem('event RewardClaimed(address indexed token,address indexed holder,uint256 amount)');

const launchAbi = parseAbiItem('function launches(address token) view returns (address token,address rewardAsset,uint256 accRewardPerToken,uint256 rewardBalance,bool active)');
const nameAbi = parseAbiItem('function name() view returns (string)');
const symbolAbi = parseAbiItem('function symbol() view returns (string)');
const decimalsAbi = parseAbiItem('function decimals() view returns (uint8)');
const totalSupplyAbi = parseAbiItem('function totalSupply() view returns (uint256)');

const CACHE_TTL_MS = 15000;
let cache = { at: 0, key: '', payload: null };

/** Reads the ERC-20 metadata a RexiToken exposes; returns nulls if a call fails. */
async function readTokenMetadata(token) {
  const [name, symbol, decimals, totalSupply, launch] = await Promise.all([
    client.readContract({ address: token, abi: [nameAbi], functionName: 'name' }).catch(() => null),
    client.readContract({ address: token, abi: [symbolAbi], functionName: 'symbol' }).catch(() => null),
    client.readContract({ address: token, abi: [decimalsAbi], functionName: 'decimals' }).catch(() => 18),
    client.readContract({ address: token, abi: [totalSupplyAbi], functionName: 'totalSupply' }).catch(() => null),
    client.readContract({ address: launchpad, abi: [launchAbi], functionName: 'launches', args: [token] }).catch(() => null)
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
 * Indexes every LaunchCreated / RewardsDistributed / RewardClaimed event emitted
 * by the launchpad and joins it with live contract state.
 */
async function buildIndex() {
  const [createdLogs, distributedLogs, claimedLogs] = await Promise.all([
    // This RPC rejects the `earliest` keyword and needs a hex quantity, so scan from block 0.
    client.getLogs({ address: launchpad, event: launchCreated, fromBlock: 0n, toBlock: 'latest' }),
    client.getLogs({ address: launchpad, event: rewardsDistributed, fromBlock: 0n, toBlock: 'latest' }),
    client.getLogs({ address: launchpad, event: rewardClaimed, fromBlock: 0n, toBlock: 'latest' })
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
    const metadata = await readTokenMetadata(token);
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
      rewardBalanceFormatted: metadata.rewardBalanceFormatted,
      rewardBalanceAmount: formatReward(metadata.rewardBalance, rewardAsset),
      accRewardPerToken: metadata.accRewardPerToken,
      active: metadata.active,
      creator,
      txHash: log.transactionHash,
      transactionHash: log.transactionHash,
      txUrl: explorerTxUrl(log.transactionHash),
      blockNumber: log.blockNumber?.toString() ?? null,
      distributionCount: bucket.distributions.length,
      distributedRaw: distributedRaw.toString(),
      distributed: formatReward(distributedRaw, rewardAsset),
      holderShare: formatReward(holderShareRaw, rewardAsset),
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
      txHash: log.transactionHash,
      txUrl: explorerTxUrl(log.transactionHash),
      blockNumber: log.blockNumber?.toString() ?? null,
      timestamp: stamp ?? null,
      ago: relativeTime(stamp)
    };
  });

const symbols = [...new Set(launches.map(l => l.rewardAssetSymbol).filter(Boolean))];
  const stats = {
    chainId: REXI_NETWORK.chainIdDecimal,
    launchpad,
    explorer: REXI_NETWORK.blockExplorerUrl,
    launchCount: launches.length,
    distributions: distributedLogs.length,
    payingTokens: launches.filter(l => l.distributionCount > 0).length,
    holderPayouts: claimedLogs.length,
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
    launchpad,
    launchpadUrl: explorerAddressUrl(launchpad),
    explorer: REXI_NETWORK.blockExplorerUrl,
    generatedAt: stats.generatedAt,
    stats,
    data: launches,
    recentDistributions,
    topLaunches: [...launches].sort((a, b) => Number(b.distributed) - Number(a.distributed)).slice(0, 8)
  };
}

async function cachedIndex() {
  if (cache.payload && cache.key === launchpad && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.payload;
  }
  const payload = await buildIndex();
  cache = { at: Date.now(), key: launchpad, payload };
  return payload;
}

router.get('/launches', async (_req, res) => {
  try {
    res.json(await cachedIndex());
  } catch (error) {
    res.status(502).json({ success: false, error: 'Robinhood Chain RPC unavailable', detail: error.message });
  }
});

router.get('/launches/:token', async (req, res) => {
  try {
    const index = await cachedIndex();
    const launch = index.data.find(l => l.token.toLowerCase() === String(req.params.token).toLowerCase());
    if (!launch) {
      return res.status(404).json({ success: false, error: 'Launch not found on this launchpad' });
    }
    res.json({
      success: true,
      chainId: index.chainId,
      launchpad: index.launchpad,
      data: {
        ...launch,
        distributions: index.recentDistributions.filter(d => d.token === launch.token)
      }
    });
  } catch (error) {
    res.status(502).json({ success: false, error: 'Robinhood Chain RPC unavailable', detail: error.message });
  }
});

export default router;
