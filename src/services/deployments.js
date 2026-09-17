/**
 * Canonical Rexi deployments.
 *
 * Single source of truth for every address the app, the API routes and the
 * deployment scripts read. If a contract is redeployed, change it here only.
 *
 * Verification: `script/verify-deployment.ps1` re-compiles the contract source
 * and compares the runtime bytecode found at the address below against the
 * local build (immutable treasury slots masked out).
 */

export const REXI_CHAIN_ID = 46630;

export const REXI_NETWORK = {
  // Derived, not hardcoded: a wrong hex here makes wallets refuse to switch.
  chainId: `0x${REXI_CHAIN_ID.toString(16)}`,
  chainIdDecimal: REXI_CHAIN_ID,
  chainName: 'Robinhood Chain Testnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrl: 'https://rpc.testnet.chain.robinhood.com',
  rpcUrls: ['https://rpc.testnet.chain.robinhood.com'],
  blockExplorerUrl: 'https://explorer.testnet.chain.robinhood.com',
  blockExplorerUrls: ['https://explorer.testnet.chain.robinhood.com']
};

/** Current RexiLaunchpad. Matches contracts/RexiLaunchpad.sol at HEAD (post security review). */
export const REXI_LAUNCHPAD = '0xabaAd57e9Dbb401356c0b03d724c2714056e7dA0';

/** Reward assets a launch can pay out with. Testnet stand-ins only. */
export const REXI_REWARD_ASSETS = [
  {
    address: '0x741Dd50A3D166589e870615c9B2D482DA800a0C3',
    symbol: 'rAAPL',
    name: 'Rexi Test Apple Stock Token',
    decimals: 18,
    testnetOnly: true,
    mintable: true
  }
];

/** Default reward asset used by the launch flow. */
export const REXI_REWARD_ASSET = REXI_REWARD_ASSETS[0].address;

/** @deprecated Earlier testnet launchpads cleared to remove test artifact data. */
export const REXI_SUPERSEDED_DEPLOYMENTS = [];

/** Fee split of every distributed reward, in basis points of the distribution. */
export const REXI_FEE_SPLIT_BPS = {
  holders: 6750,
  desks: 1000,
  protocol: 500,
  buybacks: 1000
};

/** Same split as percentages, for display. */
export const REXI_FEE_SPLIT = [
  { label: 'Holders, in the reward asset', value: '67.5%' },
  { label: 'Desks', value: '10%' },
  { label: 'Protocol', value: '5%' },
  { label: 'Bool buybacks', value: '10%' },
  { label: 'Platform operations', value: '7.5%' }
];

/**
 * Mainnet is intentionally unimplemented. Nothing here is deployed; this block
 * exists so mainnet work has one obvious home, gated by the checklist in
 * SECURITY.md ("Mainnet gate"). Requirements before filling any of this in:
 *
 *  1. independent audit of contracts/RexiLaunchpad.sol passes
 *  2. reward assets are canonical Robinhood stock tokens with verified
 *     deployers, standard ERC-20 semantics (no transfer fee, no blacklist)
 *  3. monitoring live: GET /api/chain/health returns status "ok" and
 *     `node script/monitor.mjs` runs on a schedule with alerting
 *  4. ownership/treasury keys held in multisig, not a single EOA
 */
export const REXI_MAINNET_CHAIN_ID = 4663;

export const REXI_MAINNET = {
  chainId: `0x${REXI_MAINNET_CHAIN_ID.toString(16)}`,
  chainIdDecimal: REXI_MAINNET_CHAIN_ID,
  chainName: 'Robinhood Chain',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrl: 'https://robinhood-mainnet.g.alchemy.com/v2/HMKXQ2KwDrFO0nwFthZm0',
  rpcUrls: [
    'https://robinhood-mainnet.g.alchemy.com/v2/HMKXQ2KwDrFO0nwFthZm0',
    'https://rpc.chain.robinhood.com'
  ],
  blockExplorerUrl: 'https://explorer.chain.robinhood.com',
  blockExplorerUrls: ['https://explorer.chain.robinhood.com'],
  launchpad: '0x011a50Bd4Ac29c90513728da693E69cAB678111e',
  rewardAssets: [
    {
      address: '0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9',
      symbol: 'AAPL',
      name: 'Apple • Robinhood Token',
      decimals: 18,
      category: 'stock'
    },
    {
      address: '0x322F0929c4625eD5bAd873c95208D54E1c003b2d',
      symbol: 'TSLA',
      name: 'Tesla • Robinhood Token',
      decimals: 18,
      category: 'stock'
    },
    {
      address: '0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
      category: 'crypto'
    },
    {
      address: '0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168',
      symbol: 'USDG',
      name: 'Global Dollar',
      decimals: 6,
      category: 'stablecoin'
    }
  ]
};

/** Resolves active network mode ('mainnet' | 'testnet'). Default: 'mainnet'. */
export function getActiveNetworkMode() {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_NETWORK_MODE) {
    return import.meta.env.VITE_NETWORK_MODE.toLowerCase();
  }
  if (typeof process !== 'undefined' && process.env?.NETWORK_MODE) {
    return process.env.NETWORK_MODE.toLowerCase();
  }
  return 'mainnet';
}

/** Resolves active network parameters based on mode ('mainnet' | 'testnet'). */
export function getNetworkConfig(mode = getActiveNetworkMode()) {
  return mode === 'mainnet' ? REXI_MAINNET : REXI_NETWORK;
}

/** Resolves canonical launchpad address based on mode. */
export function getCanonicalLaunchpad(mode = getActiveNetworkMode()) {
  if (mode === 'mainnet') {
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_REXI_LAUNCHPAD_MAINNET) {
      return import.meta.env.VITE_REXI_LAUNCHPAD_MAINNET;
    }
    if (typeof process !== 'undefined' && process.env?.REXI_LAUNCHPAD_MAINNET) {
      return process.env.REXI_LAUNCHPAD_MAINNET;
    }
    return REXI_MAINNET.launchpad;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_REXI_LAUNCHPAD_TESTNET) {
    return import.meta.env.VITE_REXI_LAUNCHPAD_TESTNET;
  }
  if (typeof process !== 'undefined' && process.env?.REXI_LAUNCHPAD_TESTNET) {
    return process.env.REXI_LAUNCHPAD_TESTNET;
  }
  return REXI_LAUNCHPAD;
}

/** Resolves active reward assets list based on mode. */
export function getActiveRewardAssets(mode = getActiveNetworkMode()) {
  const net = getNetworkConfig(mode);
  if (net.rewardAssets && net.rewardAssets.length > 0) {
    return net.rewardAssets;
  }
  return REXI_REWARD_ASSETS;
}

export const ACTIVE_NETWORK = getNetworkConfig();
export const ACTIVE_LAUNCHPAD = getCanonicalLaunchpad();
export const ACTIVE_REWARD_ASSETS = getActiveRewardAssets();
export const ACTIVE_REWARD_ASSET = ACTIVE_REWARD_ASSETS[0]?.address || '';

/** Launches created on the canonical launchpad, newest first. */
export const REXI_GENESIS_LAUNCHES = [
  {
    token: '0x6ec53eb68b8f6b528cb8801af1001794d3e934e8',
    name: 'Rexi Genesis',
    symbol: 'RXG',
    supply: '1000000000000000000000000',
    rewardAsset: REXI_REWARD_ASSET,
    creator: '0x0183eb7aD3ac108F083f4905b5c85E0e1A5AFf5B',
    createTx: '0x171b032ef039a3f1aeb4dc8c864422dce219c58ec897bd6fdb4f210f38d94496',
    distributeTx: '0xa41d0b14dc547aea07cc3be3f72ae1cb2836b02b7a5486c213313fe13a403428',
    claimTx: '0x9a9b963618bb74f85e1e495d6563301a3bda18b040c110e787e39cf8ac1cf910'
  }
];

export function explorerAddressUrl(address, explorerBase = ACTIVE_NETWORK.blockExplorerUrl) {
  return `${explorerBase}/address/${address}`;
}

export function explorerTxUrl(hash, explorerBase = ACTIVE_NETWORK.blockExplorerUrl) {
  return `${explorerBase}/tx/${hash}`;
}

export function shortAddress(address, size = 4) {
  if (typeof address !== 'string' || address.length < size * 2 + 2) return address || '';
  return `${address.slice(0, size + 2)}…${address.slice(-size)}`;
}

export function rewardAssetByAddress(address) {
  if (!address) return null;
  const needle = address.toLowerCase();
  const allAssets = [...(REXI_MAINNET.rewardAssets || []), ...REXI_REWARD_ASSETS];
  return allAssets.find(a => a.address.toLowerCase() === needle) || null;
}

/** True when the value looks like a deployed contract address. */
export function isAddress(value) {
  return typeof value === 'string' && /^0x[0-9a-fA-F]{40}$/.test(value);
}