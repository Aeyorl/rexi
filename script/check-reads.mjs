// Verifies the deployed launchpad, the frontend read layer and a wallet's
// reward position against live Robinhood Chain Testnet state.
//
//   node script/check-reads.mjs [launchTokenAddress] [holderAddress]
//
import {
  readLaunchpadConfig,
  readLaunch,
  readTokenInfo,
  readHolderRewards,
  readRewardAssetState
} from '../src/services/rexiChain.js';
import { REXI_GENESIS_LAUNCHES, REXI_REWARD_ASSET } from '../src/services/deployments.js';

const token = process.argv[2] || REXI_GENESIS_LAUNCHES[0].token;
const holder = process.argv[3] || REXI_GENESIS_LAUNCHES[0].creator;

const bigintSafe = (key, value) => (typeof value === 'bigint' ? value.toString() : value);

const [config, launch, info, rewards, asset] = await Promise.all([
  readLaunchpadConfig(),
  readLaunch(token),
  readTokenInfo(token),
  readHolderRewards(token, holder),
  readRewardAssetState(holder, REXI_REWARD_ASSET)
]);

console.log(`launchpad config : ${JSON.stringify(config, bigintSafe)}`);
console.log(`token info       : ${JSON.stringify(info, bigintSafe)}`);
console.log(`launch           : ${JSON.stringify({ ...launch, info: undefined, launchpad: undefined }, bigintSafe)}`);
console.log(`holder           : ${holder}`);
console.log(`holder rewards   : ${JSON.stringify(rewards, bigintSafe)}`);
console.log(`reward asset     : ${JSON.stringify(asset, bigintSafe)}`);

const issues = [];
if (!launch.active) issues.push('launch is not active');
if (launch.info && launch.info.totalSupply !== info.totalSupply) issues.push('totalSupply differs between reads');
if (rewards.accrued !== rewards.debt + rewards.pending) issues.push('pending + debt does not equal accrued');
if (rewards.pending > 0n && !rewards.claimable) issues.push('pending > 0 but claimable is false');

if (issues.length === 0) {
  console.log('\nOK: on-chain state is internally consistent with the frontend read layer.');
} else {
  console.log(`\nATTENTION:\n- ${issues.join('\n- ')}`);
  process.exitCode = 1;
}