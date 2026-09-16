import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseAbi,
  parseEventLogs,
  formatUnits,
  parseUnits
} from 'viem';
import {
  REXI_NETWORK,
  REXI_LAUNCHPAD,
  REXI_REWARD_ASSET,
  explorerAddressUrl,
  explorerTxUrl
} from './deployments.js';
import { connectRobinhoodChain } from './robinhoodChain.js';

export const chain = {
  id: REXI_NETWORK.chainIdDecimal,
  name: REXI_NETWORK.chainName,
  nativeCurrency: REXI_NETWORK.nativeCurrency,
  rpcUrls: { default: { http: REXI_NETWORK.rpcUrls } },
  blockExplorers: { default: { name: 'Robinhood Chain Explorer', url: REXI_NETWORK.blockExplorerUrl } }
};

export const LAUNCHPAD_ABI = parseAbi([
  'function createLaunch(string name, string symbol, address rewardAsset, uint256 supply) returns (address token)',
  'function distribute(address token, uint256 amount)',
  'function claim(address token)',
  'function launches(address token) view returns (address token, address rewardAsset, uint256 accRewardPerToken, uint256 rewardBalance, bool active)',
  'function rewardDebt(address token, address holder) view returns (uint256)',
  'function BPS() view returns (uint256)',
  'function HOLDER_SHARE() view returns (uint256)',
  'function ACC_SCALE() view returns (uint256)',
  'event LaunchCreated(address indexed token, address indexed rewardAsset, address indexed creator, uint256 supply)',
  'event RewardsDistributed(address indexed token, uint256 amount, uint256 holderAmount)',
  'event RewardClaimed(address indexed token, address indexed holder, uint256 amount)'
]);

export const TOKEN_ABI = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)'
]);

/** Fixed-point scale used by the launchpad reward accumulator (ACC_SCALE = 1e24). */
export const ACC_SCALE = 10n ** 24n;

let cachedPublicClient = null;

export function publicClient() {
  if (!cachedPublicClient) {
    cachedPublicClient = createPublicClient({ chain, transport: http(REXI_NETWORK.rpcUrl) });
  }
  return cachedPublicClient;
}

async function walletContext() {
  const account = await connectRobinhoodChain();
  if (!account) throw new Error('No wallet account available.');
  return { client: createWalletClient({ chain, transport: custom(window.ethereum) }), account };
}

async function waitForReceipt(hash) {
  return publicClient().waitForTransactionReceipt({ hash });
}

/* ------------------------------------------------------------------ *
 * Writes
 * ------------------------------------------------------------------ */

/**
 * Deploys a launch token through RexiLaunchpad.createLaunch and resolves the
 * address of the token that was created from the LaunchCreated event.
 */
export async function createRexiLaunch({ name, symbol, rewardAsset = REXI_REWARD_ASSET, supply = 1000000 }) {
  const { client, account } = await walletContext();
  const hash = await client.writeContract({
    address: REXI_LAUNCHPAD,
    abi: LAUNCHPAD_ABI,
    functionName: 'createLaunch',
    account,
    args: [name, symbol, rewardAsset, parseUnits(String(supply), 18)]
  });
  const receipt = await waitForReceipt(hash);
  const [created] = parseEventLogs({ abi: LAUNCHPAD_ABI, eventName: 'LaunchCreated', logs: receipt.logs });
  const token = created?.args?.token || null;
  return {
    hash,
    token,
    account,
    supply: parseUnits(String(supply), 18),
    txUrl: explorerTxUrl(hash),
    tokenUrl: token ? explorerAddressUrl(token) : null
  };
}

/** Approves a launchpad to pull `amount` of a reward asset from the wallet. */
export async function approveRewards(amount, asset = REXI_REWARD_ASSET, launchpad = REXI_LAUNCHPAD) {
  const { client, account } = await walletContext();
  const hash = await client.writeContract({
    address: asset,
    abi: TOKEN_ABI,
    functionName: 'approve',
    account,
    args: [launchpad, parseUnits(String(amount), 18)]
  });
  await waitForReceipt(hash);
  return { hash, launchpad, txUrl: explorerTxUrl(hash) };
}

/** Distributes a reward asset to every holder of `token` (67.5% to holders). */
export async function distributeRewards(token, amount, asset = REXI_REWARD_ASSET, launchpad = REXI_LAUNCHPAD) {
  const { client, account } = await walletContext();
  const hash = await client.writeContract({
    address: launchpad,
    abi: LAUNCHPAD_ABI,
    functionName: 'distribute',
    account,
    args: [token, parseUnits(String(amount), 18)]
  });
  await waitForReceipt(hash);
  return { hash, account, asset, launchpad, txUrl: explorerTxUrl(hash) };
}

/** Claims the caller's accrued rewards for `token` on its own launchpad. */
export async function claimRewards(token, launchpad = REXI_LAUNCHPAD) {
  const { client, account } = await walletContext();
  const hash = await client.writeContract({
    address: launchpad,
    abi: LAUNCHPAD_ABI,
    functionName: 'claim',
    account,
    args: [token]
  });
  await waitForReceipt(hash);
  return { hash, account, launchpad, txUrl: explorerTxUrl(hash) };
}

/* ------------------------------------------------------------------ *
 * Reads (public RPC — no wallet required)
 * ------------------------------------------------------------------ */

export async function readTokenInfo(token) {
  const client = publicClient();
  const [name, symbol, decimals, totalSupply] = await Promise.all([
    client.readContract({ address: token, abi: TOKEN_ABI, functionName: 'name' }),
    client.readContract({ address: token, abi: TOKEN_ABI, functionName: 'symbol' }),
    client.readContract({ address: token, abi: TOKEN_ABI, functionName: 'decimals' }),
    client.readContract({ address: token, abi: TOKEN_ABI, functionName: 'totalSupply' })
  ]);
  return {
    name,
    symbol,
    decimals,
    totalSupply,
    totalSupplyFormatted: formatUnits(totalSupply, decimals)
  };
}

export async function readLaunch(token, launchpad = REXI_LAUNCHPAD) {
  const client = publicClient();
  const [launch, info] = await Promise.all([
    client.readContract({ address: launchpad, abi: LAUNCHPAD_ABI, functionName: 'launches', args: [token] }),
    readTokenInfo(token).catch(() => null)
  ]);
  const [tokenAddress, rewardAsset, accRewardPerToken, rewardBalance, active] = launch;
  return {
    token: tokenAddress,
    rewardAsset,
    accRewardPerToken,
    rewardBalance,
    active,
    rewardBalanceFormatted: formatUnits(rewardBalance, 18),
    info,
    tokenUrl: explorerAddressUrl(token),
    launchpad,
    launchpadUrl: explorerAddressUrl(launchpad)
  };
}

/**
 * Mirrors the on-chain claim maths: accrued = balance * accRewardPerToken / ACC_SCALE.
 * `pending` is exactly what `claim()` would pay out right now.
 */
export async function readHolderRewards(token, account, launchpad = REXI_LAUNCHPAD) {
  if (!account) return null;
  const client = publicClient();
  const [launch, balance, debt] = await Promise.all([
    client.readContract({ address: launchpad, abi: LAUNCHPAD_ABI, functionName: 'launches', args: [token] }),
    client.readContract({ address: token, abi: TOKEN_ABI, functionName: 'balanceOf', args: [account] }),
    client.readContract({ address: launchpad, abi: LAUNCHPAD_ABI, functionName: 'rewardDebt', args: [token, account] })
  ]);
  const accRewardPerToken = launch[2];
  const accrued = (balance * accRewardPerToken) / ACC_SCALE;
  const pending = accrued > debt ? accrued - debt : 0n;
  return {
    held: balance,
    heldFormatted: formatUnits(balance, 18),
    accrued,
    accruedFormatted: formatUnits(accrued, 18),
    debt,
    pending,
    pendingFormatted: formatUnits(pending, 18),
    claimable: pending > 0n
  };
}

/** Reward-asset balance and launchpad allowance for the connected wallet. */
export async function readRewardAssetState(account, asset = REXI_REWARD_ASSET, launchpad = REXI_LAUNCHPAD) {
  if (!account) return null;
  const client = publicClient();
  const [balance, allowance, symbol] = await Promise.all([
    client.readContract({ address: asset, abi: TOKEN_ABI, functionName: 'balanceOf', args: [account] }),
    client.readContract({ address: asset, abi: TOKEN_ABI, functionName: 'allowance', args: [account, launchpad] }),
    client.readContract({ address: asset, abi: TOKEN_ABI, functionName: 'symbol' }).catch(() => 'reward')
  ]);
  return {
    asset,
    symbol,
    balance,
    balanceFormatted: formatUnits(balance, 18),
    allowance,
    allowanceFormatted: formatUnits(allowance, 18),
    approvedForLaunchpad: allowance > 0n
  };
}

/** Launchpad constants read from the deployed contract, so the UI never guesses. */
export async function readLaunchpadConfig(launchpad = REXI_LAUNCHPAD) {
  const client = publicClient();
  const [bps, holderShare, accScale] = await Promise.all([
    client.readContract({ address: launchpad, abi: LAUNCHPAD_ABI, functionName: 'BPS' }),
    client.readContract({ address: launchpad, abi: LAUNCHPAD_ABI, functionName: 'HOLDER_SHARE' }),
    client.readContract({ address: launchpad, abi: LAUNCHPAD_ABI, functionName: 'ACC_SCALE' })
  ]);
  return {
    launchpad,
    bps: Number(bps),
    holderShare: Number(holderShare),
    holderSharePercent: (Number(holderShare) / Number(bps)) * 100,
    accScale
  };
}
