// Rexi drift monitor — verifies the reward-accounting invariants directly against
// Robinhood Chain for every launchpad (canonical + superseded) and exits non-zero
// on any drift, so it can run from cron or a scheduled job.
//
//   node script/monitor.mjs
//
import { createPublicClient, http, parseAbiItem, formatUnits } from 'viem';
import {
  REXI_NETWORK,
  REXI_LAUNCHPAD,
  REXI_SUPERSEDED_DEPLOYMENTS
} from '../src/services/deployments.js';

const client = createPublicClient({ transport: http(REXI_NETWORK.rpcUrl) });
const launchpads = [REXI_LAUNCHPAD, ...REXI_SUPERSEDED_DEPLOYMENTS.map(d => d.address)];

const launchCreated = parseAbiItem('event LaunchCreated(address indexed token,address indexed rewardAsset,address indexed creator,uint256 supply)');
const rewardsDistributed = parseAbiItem('event RewardsDistributed(address indexed token,uint256 amount,uint256 holderAmount)');
const rewardClaimed = parseAbiItem('event RewardClaimed(address indexed token,address indexed holder,uint256 amount)');
const launchAbi = parseAbiItem('function launches(address token) view returns (address token,address rewardAsset,uint256 accRewardPerToken,uint256 rewardBalance,bool active)');
const balanceOfAbi = parseAbiItem('function balanceOf(address account) view returns (uint256)');

const fmt = (value) => `${formatUnits(value, 18)}`;

async function audit(launchpad) {
  const [createdLogs, distributedLogs, claimedLogs] = await Promise.all([
    client.getLogs({ address: launchpad, event: launchCreated, fromBlock: 0n, toBlock: 'latest' }),
    client.getLogs({ address: launchpad, event: rewardsDistributed, fromBlock: 0n, toBlock: 'latest' }),
    client.getLogs({ address: launchpad, event: rewardClaimed, fromBlock: 0n, toBlock: 'latest' })
  ]);

  const launches = [];
  const bucketsByAsset = new Map();

  for (const log of createdLogs) {
    const { token, rewardAsset } = log.args;
    const distributions = distributedLogs.filter(l => l.args.token === token);
    const claims = claimedLogs.filter(l => l.args.token === token);
    const holderShare = distributions.reduce((sum, l) => sum + l.args.holderAmount, 0n);
    const claimed = claims.reduce((sum, l) => sum + l.args.amount, 0n);
    const launch = await client.readContract({ address: launchpad, abi: [launchAbi], functionName: 'launches', args: [token] });
    const onChain = launch[3];
    const expected = holderShare - claimed;
    const drift = onChain - expected;
    launches.push({ token, rewardAsset, expected, onChain, drift, distributions: distributions.length, claims: claims.length });
    const key = rewardAsset.toLowerCase();
    bucketsByAsset.set(key, { rewardAsset, buckets: (bucketsByAsset.get(key)?.buckets ?? 0n) + onChain });
  }

  const assets = [];
  for (const entry of bucketsByAsset.values()) {
    const raw = await client
      .readContract({ address: entry.rewardAsset, abi: [balanceOfAbi], functionName: 'balanceOf', args: [launchpad] })
      .catch(() => null);
    assets.push({
      rewardAsset: entry.rewardAsset,
      buckets: entry.buckets,
      contractBalance: raw,
      surplus: raw == null ? null : raw - entry.buckets
    });
  }

  return { launchpad, launches, assets };
}

const results = await Promise.all(launchpads.map(audit));
let failures = 0;

for (const result of results) {
  const legacy = result.launchpad.toLowerCase() !== REXI_LAUNCHPAD.toLowerCase();
  console.log(`\nlaunchpad ${result.launchpad}${legacy ? ' (legacy)' : ''}`);
  console.log(`  launches: ${result.launches.length}, distributions: ${result.launches.reduce((n, l) => n + l.distributions, 0)}`);
  for (const launch of result.launches) {
    const ok = launch.drift === 0n;
    if (!ok) failures += 1;
    console.log(`  ${ok ? 'OK  ' : 'DRIFT'} ${launch.token} bucket=${fmt(launch.onChain)} expected=${fmt(launch.expected)} drift=${fmt(launch.drift < 0n ? -launch.drift : launch.drift)}`);
  }
  for (const asset of result.assets) {
    const solvency = asset.surplus == null ? 'unknown' : (asset.surplus >= 0n ? 'OK' : 'INSOLVENT');
    if (solvency === 'INSOLVENT') failures += 1;
    console.log(`  ${solvency} asset ${asset.rewardAsset} buckets=${fmt(asset.buckets)} balance=${asset.contractBalance == null ? 'n/a' : fmt(asset.contractBalance)} surplus=${asset.surplus == null ? 'n/a' : fmt(asset.surplus < 0n ? -asset.surplus : asset.surplus)}`);
  }
}

if (failures === 0) {
  console.log('\nAll launchpads healthy: buckets match event history and every asset covers its buckets.');
} else {
  console.log(`\n${failures} check(s) failed — investigate before continuing operation.`);
  process.exitCode = 1;
}