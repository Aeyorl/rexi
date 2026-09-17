import { createPublicClient, http, fallback, parseAbiItem, parseEventLogs, formatUnits } from 'viem';

if (typeof process.loadEnvFile === 'function') {
  try { process.loadEnvFile(); } catch (_) {}
}

import {
  REXI_NETWORK,
  REXI_MAINNET,
  REXI_LAUNCHPAD,
  getNetworkConfig,
  getCanonicalLaunchpad,
  rewardAssetByAddress,
  explorerAddressUrl,
  explorerTxUrl
} from '../src/services/deployments.js';

// --- ABI Definitions ---
const launchCreatedEvent = parseAbiItem('event LaunchCreated(address indexed token,address indexed rewardAsset,address indexed creator,uint256 supply)');
const rewardsDistributedEvent = parseAbiItem('event RewardsDistributed(address indexed token,uint256 amount,uint256 holderAmount)');
const rewardClaimedEvent = parseAbiItem('event RewardClaimed(address indexed token,address indexed holder,uint256 amount)');

const launchAbi = parseAbiItem('function launches(address token) view returns (address token,address rewardAsset,uint256 accRewardPerToken,uint256 rewardBalance,bool active)');
const nameAbi = parseAbiItem('function name() view returns (string)');
const symbolAbi = parseAbiItem('function symbol() view returns (string)');
const decimalsAbi = parseAbiItem('function decimals() view returns (uint8)');
const totalSupplyAbi = parseAbiItem('function totalSupply() view returns (uint256)');
const balanceOfAbi = parseAbiItem('function balanceOf(address account) view returns (uint256)');
const protocolTreasuryAbi = parseAbiItem('function protocolTreasury() view returns (address)');
const desksTreasuryAbi = parseAbiItem('function desksTreasury() view returns (address)');
const buybackTreasuryAbi = parseAbiItem('function buybackTreasury() view returns (address)');

// --- Network & Client Initialization ---
const networkMode = (process.env.NETWORK_MODE || 'mainnet').toLowerCase();
const networkConfig = getNetworkConfig(networkMode);
const canonicalLaunchpad = getCanonicalLaunchpad(networkMode);

const primaryRpc = networkMode === 'mainnet'
  ? (process.env.RH_MAINNET_RPC_URL || networkConfig.rpcUrl)
  : (process.env.RH_RPC_URL || networkConfig.rpcUrl);

const fallbackRpc = networkMode === 'mainnet'
  ? process.env.RH_MAINNET_FALLBACK_RPC
  : process.env.RH_FALLBACK_RPC;

const transportList = [http(primaryRpc, { retryCount: 3, retryDelay: 1000 })];
if (fallbackRpc) {
  transportList.push(http(fallbackRpc, { retryCount: 3, retryDelay: 1000 }));
}

export const client = createPublicClient({
  transport: transportList.length > 1 ? fallback(transportList) : transportList[0]
});

const DEFAULT_CHUNK_SIZE = networkMode === 'mainnet' ? 10n : BigInt(process.env.INDEXER_CHUNK_SIZE || '5000');
const POLL_INTERVAL_MS = Number(process.env.INDEXER_POLL_INTERVAL_MS || '10000');

const configuredStartBlock = networkMode === 'mainnet'
  ? BigInt(process.env.REXI_MAINNET_START_BLOCK || '65314300')
  : BigInt(process.env.REXI_TESTNET_START_BLOCK || '120290000');

// Accumulated event logs across incremental sync cycles (seeded with Mainnet Genesis if in mainnet mode)
let accumulatedCreatedLogs = networkMode === 'mainnet' ? [
  {
    eventName: 'LaunchCreated',
    args: {
      token: '0x65DaF75eef96316C5b38C8D928106Ea371D9a0fA',
      rewardAsset: '0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73',
      creator: '0x0183eb7aD3ac108F083f4905b5c85E0e1A5AFf5B',
      supply: 1000000000000000000000000n
    },
    transactionHash: '0x01452de773fbd695f65344ce3f6bad7dc31c47331e4fa7de3057ca34c2d2ad87',
    blockNumber: 65385305n
  }
] : [];

let accumulatedDistributedLogs = networkMode === 'mainnet' ? [
  {
    eventName: 'RewardsDistributed',
    args: {
      token: '0x65DaF75eef96316C5b38C8D928106Ea371D9a0fA',
      amount: 100000000000000n,
      holderAmount: 67500000000000n
    },
    transactionHash: '0xf114f4e21064b78e8e3cd85090ef09ada35073a38652092155d943f984549b82',
    blockNumber: 65388600n
  }
] : [];

let accumulatedClaimedLogs = networkMode === 'mainnet' ? [
  {
    eventName: 'RewardClaimed',
    args: {
      token: '0x65DaF75eef96316C5b38C8D928106Ea371D9a0fA',
      holder: '0x0183eb7aD3ac108F083f4905b5c85E0e1A5AFf5B',
      amount: 67500000000000n
    },
    transactionHash: '0xbc8fa8870183354394019a8616fa1b131920b6e9275990529d4432a537f86445',
    blockNumber: 65388650n
  }
] : [];

// --- In-Memory State Cache ---
let inMemoryState = {
  networkMode,
  chainId: networkConfig.chainIdDecimal,
  launchpad: canonicalLaunchpad,
  launchpadUrl: canonicalLaunchpad ? explorerAddressUrl(canonicalLaunchpad, networkConfig.blockExplorerUrl) : null,
  explorer: networkConfig.blockExplorerUrl,
  lastSyncedBlock: null,
  latestNetworkBlock: null,
  isSyncing: false,
  lastSyncTime: null,
  syncError: null,
  launches: [],
  recentDistributions: [],
  stats: null,
  activity: null,
  health: null
};

let pollTimer = null;

// --- Helper Utilities ---
function formatReward(value, rewardAsset) {
  const decimals = rewardAssetByAddress(rewardAsset)?.decimals ?? 18;
  return formatUnits(value ?? 0n, decimals);
}

function splitOf(amount) {
  const holders = (amount * 6750n) / 10000n;
  const protocol = (amount * 500n) / 10000n;
  const desks = (amount * 1000n) / 10000n;
  const buybacks = (amount * 1000n) / 10000n;
  return { holders, protocol, desks, buybacks, platformOps: amount - holders - protocol - desks - buybacks };
}

function relativeTime(seconds) {
  if (seconds == null) return null;
  const delta = Math.max(0, Math.floor(Date.now() / 1000) - seconds);
  if (delta < 60) return `${delta}s ago`;
  if (delta < 3600) return `${Math.floor(delta / 60)}m ago`;
  if (delta < 86400) return `${Math.floor(delta / 3600)}h ago`;
  return `${Math.floor(delta / 86400)}d ago`;
}

async function timestampsFor(logs) {
  const unique = [...new Set(logs.map(l => l.blockNumber).filter(Boolean))];
  const entries = await Promise.all(unique.map(async (blockNumber) => {
    const block = await client.getBlock({ blockNumber }).catch(() => null);
    return [blockNumber.toString(), block?.timestamp ? Number(block.timestamp) : null];
  }));
  return Object.fromEntries(entries);
}

const launchpadEvents = [launchCreatedEvent, rewardsDistributedEvent, rewardClaimedEvent];

/**
 * High performance log fetcher: queries all events in one pass per chunk
 * and parses them with parseEventLogs to respect RPC range limits.
 */
export async function fetchLaunchpadLogs({ address, fromBlock, toBlock, chunkSize = DEFAULT_CHUNK_SIZE }) {
  if (!address || fromBlock > toBlock) return [];
  const rawLogs = [];
  let currentFrom = fromBlock;
  let currentChunk = chunkSize;

  while (currentFrom <= toBlock) {
    const currentTo = (currentFrom + currentChunk - 1n) < toBlock
      ? (currentFrom + currentChunk - 1n)
      : toBlock;

    try {
      const logs = await client.getLogs({
        address,
        fromBlock: currentFrom,
        toBlock: currentTo
      });
      rawLogs.push(...logs);
      currentFrom = currentTo + 1n;
    } catch (err) {
      if (/10 block range/i.test(err.message)) {
        currentChunk = 10n;
      } else if (currentChunk > 10n && /range|limit|exceed|413|block/i.test(err.message)) {
        currentChunk = currentChunk / 2n;
      } else {
        throw err;
      }
    }
  }

  return parseEventLogs({ abi: launchpadEvents, logs: rawLogs });
}

/**
 * Reads token metadata and launchpad accounting state for an individual launch.
 */
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

/**
 * Reads the protocol, desks, and buyback treasuries directly from the launchpad.
 */
async function readTreasuries(launchpadAddress, assets) {
  const roles = [
    { role: 'protocol', functionName: 'protocolTreasury', abi: protocolTreasuryAbi },
    { role: 'desks', functionName: 'desksTreasury', abi: desksTreasuryAbi },
    { role: 'buyback', functionName: 'buybackTreasury', abi: buybackTreasuryAbi }
  ];
  const entries = await Promise.all(roles.map(async ({ role, functionName, abi }) => {
    const address = await client
      .readContract({ address: launchpadAddress, abi: [abi], functionName })
      .catch(() => null);
    if (!address) return null;
    const balances = await Promise.all(assets.map(async (asset) => {
      const raw = await client
        .readContract({ address: asset, abi: [balanceOfAbi], functionName: 'balanceOf', args: [address] })
        .catch(() => null);
      return {
        asset,
        symbol: rewardAssetByAddress(asset)?.symbol ?? null,
        raw: raw?.toString() ?? null,
        formatted: raw != null ? formatReward(raw, asset) : null
      };
    }));
    return {
      launchpad: launchpadAddress,
      legacy: false,
      role,
      address,
      addressUrl: explorerAddressUrl(address, networkConfig.blockExplorerUrl),
      balances
    };
  }));
  return entries.filter(Boolean);
}

/**
 * Performs a complete on-chain indexing cycle.
 */
export async function syncCycle() {
  if (!canonicalLaunchpad) {
    inMemoryState.syncStatus = 'No canonical launchpad configured for network.';
    return;
  }

  inMemoryState.isSyncing = true;
  inMemoryState.syncError = null;
  try {
    const latestBlockNumber = await client.getBlockNumber();
    inMemoryState.latestNetworkBlock = latestBlockNumber.toString();

    const fromBlock = inMemoryState.lastSyncedBlock
      ? (BigInt(inMemoryState.lastSyncedBlock) + 1n)
      : (networkMode === 'mainnet' ? (latestBlockNumber - 5n) : configuredStartBlock);

    if (fromBlock <= latestBlockNumber) {
      const parsedLogs = await fetchLaunchpadLogs({
        address: canonicalLaunchpad,
        fromBlock,
        toBlock: latestBlockNumber,
        chunkSize: DEFAULT_CHUNK_SIZE
      });

      for (const log of parsedLogs) {
        if (log.eventName === 'LaunchCreated') accumulatedCreatedLogs.push(log);
        else if (log.eventName === 'RewardsDistributed') accumulatedDistributedLogs.push(log);
        else if (log.eventName === 'RewardClaimed') accumulatedClaimedLogs.push(log);
      }
    }

    const createdLogs = accumulatedCreatedLogs;
    const distributedLogs = accumulatedDistributedLogs;
    const claimedLogs = accumulatedClaimedLogs;

    // Group logs by token
    const byToken = new Map();
    for (const token of new Set(createdLogs.map(l => l.args.token))) {
      byToken.set(token, { distributions: [], claims: [] });
    }
    for (const log of distributedLogs) byToken.get(log.args.token)?.distributions.push(log);
    for (const log of claimedLogs) byToken.get(log.args.token)?.claims.push(log);

    // Build Launches View
    const launches = await Promise.all(createdLogs.map(async (log) => {
      const { token, rewardAsset, creator, supply } = log.args;
      const bucket = byToken.get(token) || { distributions: [], claims: [] };
      const metadata = await readTokenMetadata(token, canonicalLaunchpad);
      const distributedRaw = bucket.distributions.reduce((sum, l) => sum + l.args.amount, 0n);
      const holderShareRaw = bucket.distributions.reduce((sum, l) => sum + l.args.holderAmount, 0n);
      const claimedRaw = bucket.claims.reduce((sum, l) => sum + l.args.amount, 0n);
      const asset = rewardAssetByAddress(rewardAsset);
      const decimalsValue = metadata.decimals ?? 18;

      return {
        token,
        tokenUrl: explorerAddressUrl(token, networkConfig.blockExplorerUrl),
        name: metadata.name,
        symbol: metadata.symbol,
        decimals: decimalsValue,
        totalSupply: metadata.totalSupply ?? supply?.toString() ?? null,
        supply: supply?.toString() ?? null,
        supplyFormatted: supply != null ? formatUnits(supply, decimalsValue) : null,
        rewardAsset,
        rewardAssetSymbol: asset?.symbol ?? null,
        rewardAssetName: asset?.name ?? null,
        rewardAssetIsTestToken: asset?.testnetOnly ?? (networkMode === 'testnet'),
        rewardBalance: metadata.rewardBalance,
        rewardBalanceRaw: metadata.rewardBalance,
        rewardBalanceFormatted: metadata.rewardBalanceFormatted,
        rewardBalanceAmount: formatReward(metadata.rewardBalance, rewardAsset),
        accRewardPerToken: metadata.accRewardPerToken,
        active: metadata.active,
        creator,
        launchpad: canonicalLaunchpad,
        launchpadUrl: explorerAddressUrl(canonicalLaunchpad, networkConfig.blockExplorerUrl),
        legacy: false,
        txHash: log.transactionHash,
        transactionHash: log.transactionHash,
        txUrl: explorerTxUrl(log.transactionHash, networkConfig.blockExplorerUrl),
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

    // Recent Distributions
    const recentLogs = distributedLogs.slice(-10).reverse();
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
        launchpad: canonicalLaunchpad,
        legacy: false,
        txHash: log.transactionHash,
        txUrl: explorerTxUrl(log.transactionHash, networkConfig.blockExplorerUrl),
        blockNumber: log.blockNumber?.toString() ?? null,
        timestamp: stamp ?? null,
        ago: relativeTime(stamp)
      };
    });

    // Stats
    const symbols = [...new Set(launches.map(l => l.rewardAssetSymbol).filter(Boolean))];
    const stats = {
      network: networkMode,
      chainId: networkConfig.chainIdDecimal,
      launchpad: canonicalLaunchpad,
      launchpads: [canonicalLaunchpad],
      legacyLaunchpads: 0,
      explorer: networkConfig.blockExplorerUrl,
      launchCount: launches.length,
      legacyLaunchCount: 0,
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
      lastSyncedBlock: latestBlockNumber.toString(),
      generatedAt: new Date().toISOString()
    };

    // Financial Activity & Daily Breakdown
    const activityRows = [];
    const assetSet = new Set();
    for (const log of distributedLogs) {
      const launch = launches.find(l => l.token === log.args.token);
      if (!launch) continue;
      assetSet.add(launch.rewardAsset);
      activityRows.push({
        token: launch.token,
        symbol: launch.symbol,
        name: launch.name,
        launchpad: canonicalLaunchpad,
        legacy: false,
        rewardAsset: launch.rewardAsset,
        rewardAssetSymbol: launch.rewardAssetSymbol,
        amount: log.args.amount,
        splits: splitOf(log.args.amount),
        txHash: log.transactionHash,
        blockNumber: log.blockNumber
      });
    }

    activityRows.sort((a, b) => Number(b.blockNumber ?? 0) - Number(a.blockNumber ?? 0));
    const actStamps = await timestampsFor(activityRows);
    const assetList = [...assetSet];

    const zeroSplit = () => ({ distributed: 0n, holders: 0n, protocol: 0n, desks: 0n, buybacks: 0n, platformOps: 0n, count: 0 });
    const totals = zeroSplit();
    const perAsset = new Map();
    const perDay = new Map();

    const bumpSplit = (entry, amount, splits) => {
      entry.distributed += amount;
      entry.holders += splits.holders;
      entry.protocol += splits.protocol;
      entry.desks += splits.desks;
      entry.buybacks += splits.buybacks;
      entry.platformOps += splits.platformOps;
      entry.count += 1;
    };

    const distributions = activityRows.map((row) => {
      const stamp = actStamps[row.blockNumber?.toString()];
      const day = stamp ? new Date(stamp * 1000).toISOString().slice(0, 10) : null;
      bumpSplit(totals, row.amount, row.splits);
      const assetEntry = perAsset.get(row.rewardAsset) || { ...zeroSplit(), asset: row.rewardAsset, symbol: row.rewardAssetSymbol };
      bumpSplit(assetEntry, row.amount, row.splits);
      perAsset.set(row.rewardAsset, assetEntry);

      if (day) {
        const dayEntry = perDay.get(day) || { ...zeroSplit(), day };
        bumpSplit(dayEntry, row.amount, row.splits);
        perDay.set(day, dayEntry);
      }

      return {
        token: row.token,
        symbol: row.symbol,
        name: row.name,
        launchpad: row.launchpad,
        legacy: row.legacy,
        amount: formatReward(row.amount, row.rewardAsset),
        holders: formatReward(row.splits.holders, row.rewardAsset),
        protocol: formatReward(row.splits.protocol, row.rewardAsset),
        desks: formatReward(row.splits.desks, row.rewardAsset),
        buybacks: formatReward(row.splits.buybacks, row.rewardAsset),
        platformOps: formatReward(row.splits.platformOps, row.rewardAsset),
        rewardAssetSymbol: row.rewardAssetSymbol,
        txHash: row.txHash,
        txUrl: explorerTxUrl(row.txHash, networkConfig.blockExplorerUrl),
        blockNumber: row.blockNumber?.toString() ?? null,
        timestamp: stamp ?? null,
        ago: relativeTime(stamp)
      };
    });

    const asMoney = (entry, asset) => ({
      distributed: formatReward(entry.distributed, asset),
      holders: formatReward(entry.holders, asset),
      protocol: formatReward(entry.protocol, asset),
      desks: formatReward(entry.desks, asset),
      buybacks: formatReward(entry.buybacks, asset),
      platformOps: formatReward(entry.platformOps, asset),
      count: entry.count
    });

    const primaryAsset = assetList[0] || null;
    const treasuries = await readTreasuries(canonicalLaunchpad, assetList);

    const byDay = [...perDay.values()]
      .sort((a, b) => (a.day < b.day ? -1 : 1))
      .map((entry) => ({
        ...asMoney(entry, primaryAsset),
        day: entry.day,
        fees: formatReward(entry.protocol + entry.desks + entry.buybacks + entry.platformOps, primaryAsset)
      }));

    const activity = {
      success: true,
      network: networkMode,
      chainId: networkConfig.chainIdDecimal,
      launchpads: [canonicalLaunchpad],
      explorer: networkConfig.blockExplorerUrl,
      generatedAt: new Date().toISOString(),
      totals: { ...asMoney(totals, primaryAsset), distributions: totals.count },
      byAsset: [...perAsset.values()].map(entry => ({ asset: entry.asset, symbol: entry.symbol, ...asMoney(entry, entry.asset) })),
      treasuries,
      byDay,
      distributions
    };

    // Health / Solvency Audit Invariants
    const healthLaunches = [];
    const healthAssets = new Map();

    for (const launch of launches) {
      const expected = BigInt(launch.holderShareRaw) - BigInt(launch.claimedRaw);
      const onChain = BigInt(launch.rewardBalanceRaw ?? '0');
      const drift = onChain - expected;
      healthLaunches.push({
        launchpad: canonicalLaunchpad,
        legacy: false,
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

      const entry = healthAssets.get(launch.rewardAsset) || {
        launchpad: canonicalLaunchpad,
        asset: launch.rewardAsset,
        symbol: launch.rewardAssetSymbol,
        buckets: 0n
      };
      entry.buckets += onChain;
      healthAssets.set(launch.rewardAsset, entry);
    }

    await Promise.all([...healthAssets.values()].map(async (entry) => {
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

    const assetChecks = [...healthAssets.values()].map(entry => ({
      launchpad: entry.launchpad,
      legacy: false,
      asset: entry.asset,
      symbol: entry.symbol,
      bucketTotal: entry.bucketTotal,
      contractBalanceRaw: entry.contractBalanceRaw,
      contractBalance: entry.contractBalance,
      surplus: entry.surplus,
      surplusFormatted: entry.surplusFormatted,
      solvency: entry.solvency
    }));

    const bucketDrift = healthLaunches.filter(l => !l.healthy);
    const insolvent = assetChecks.filter(a => a.solvency === 'insolvent');

    const health = {
      success: true,
      network: networkMode,
      chainId: networkConfig.chainIdDecimal,
      launchpads: [canonicalLaunchpad],
      generatedAt: new Date().toISOString(),
      status: bucketDrift.length === 0 && insolvent.length === 0 ? 'ok' : 'drift',
      summary: {
        launchesChecked: healthLaunches.length,
        launchesWithBucketDrift: bucketDrift.length,
        assetsChecked: assetChecks.length,
        insolventAssets: insolvent.length
      },
      launches: healthLaunches,
      assets: assetChecks
    };

    // Update in-memory state atomically
    inMemoryState = {
      ...inMemoryState,
      lastSyncedBlock: latestBlockNumber.toString(),
      lastSyncTime: new Date().toISOString(),
      isSyncing: false,
      launches,
      recentDistributions,
      stats,
      activity,
      health
    };
  } catch (error) {
    console.error('[Indexer] Sync error:', error);
    inMemoryState.syncError = error.message;
    inMemoryState.isSyncing = false;
  }
}

/**
 * Starts the periodic background sync worker.
 */
export function startBackgroundSync() {
  if (pollTimer) return;
  console.log(`[Indexer] Starting background sync (${networkMode.toUpperCase()}, chainId ${networkConfig.chainIdDecimal})...`);
  // Execute immediately
  syncCycle().catch(err => console.error('[Indexer] Initial sync error:', err));
  // Set interval
  pollTimer = setInterval(() => {
    syncCycle().catch(err => console.error('[Indexer] Polling sync error:', err));
  }, POLL_INTERVAL_MS);
}

/**
 * Stops the background poller gracefully.
 */
export function stopBackgroundSync() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
    console.log('[Indexer] Background sync stopped.');
  }
}

// --- Getter API Methods (Instant In-Memory Retrieval) ---
export function getLaunchesIndex() {
  return {
    success: true,
    network: inMemoryState.networkMode,
    chainId: inMemoryState.chainId,
    launchpad: inMemoryState.launchpad,
    launchpadUrl: inMemoryState.launchpadUrl,
    explorer: inMemoryState.explorer,
    generatedAt: inMemoryState.stats?.generatedAt || new Date().toISOString(),
    stats: inMemoryState.stats,
    data: inMemoryState.launches,
    recentDistributions: inMemoryState.recentDistributions,
    topLaunches: [...inMemoryState.launches].sort((a, b) => Number(b.distributedRaw ?? 0) - Number(a.distributedRaw ?? 0)).slice(0, 8)
  };
}

export function getLaunchDetail(token) {
  const launch = inMemoryState.launches.find(l => l.token.toLowerCase() === String(token).toLowerCase());
  if (!launch) return null;
  return {
    success: true,
    network: inMemoryState.networkMode,
    chainId: inMemoryState.chainId,
    launchpad: launch.launchpad,
    data: {
      ...launch,
      distributions: inMemoryState.recentDistributions.filter(d => d.token.toLowerCase() === launch.token.toLowerCase())
    }
  };
}

export function getChainActivity() {
  return inMemoryState.activity;
}

export function getChainHealth() {
  return inMemoryState.health;
}

export function getSyncStatus() {
  return {
    network: inMemoryState.networkMode,
    chainId: inMemoryState.chainId,
    launchpad: inMemoryState.launchpad,
    isSyncing: inMemoryState.isSyncing,
    lastSyncedBlock: inMemoryState.lastSyncedBlock,
    latestNetworkBlock: inMemoryState.latestNetworkBlock,
    lastSyncTime: inMemoryState.lastSyncTime,
    pollIntervalMs: POLL_INTERVAL_MS,
    syncError: inMemoryState.syncError
  };
}
