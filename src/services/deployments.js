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

/** @deprecated earlier testnet launchpads, kept for historical lookup only. */
export const REXI_SUPERSEDED_DEPLOYMENTS = [
  {
    address: '0x22F4fdfF29411E7E0a136A2d3802Dd96a3B52cC0',
    kind: 'RexiLaunchpad',
    replacedBy: REXI_LAUNCHPAD,
    note: 'Hardened reward-accounting build. Superseded by the security-review fixes (SECURITY.md R1-R5); launches on it are frozen.'
  },
  {
    address: '0xfd9FD9Ba704e5395D591b0d36CF682061e318F90',
    kind: 'RexiLaunchpad',
    replacedBy: REXI_LAUNCHPAD,
    note: 'First testnet deployment. Superseded by the hardened reward-accounting build.'
  }
];

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
  { label: 'Rexi buybacks', value: '10%' },
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
export const REXI_MAINNET = {
  network: {
    chainId: null,      // Robinhood Chain mainnet is chainId 4663
    rpcUrl: null,
    blockExplorerUrl: null
  },
  launchpad: null,
  rewardAssets: []
};

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
  },
  {
    token: '0xA1bcc84b5D389aD3d96EFb3360A0EA44B8aa57C7',
    name: 'Rexi Genesis (superseded launchpad)',
    symbol: 'RXG',
    supply: '1000000000000000000000000',
    rewardAsset: REXI_REWARD_ASSET,
    creator: '0x0183eb7aD3ac108F083f4905b5c85E0e1A5AFf5B',
    launchpad: '0x22F4fdfF29411E7E0a136A2d3802Dd96a3B52cC0',
    createTx: '0x80b1bc2949b476584fbe5dedf283d6e997efd839f7e5f3d0c4855618e9703b62',
    distributeTx: '0x7b97eb490cf762be3e82000955b77bbe8faef1c13509055166375635d29bac44',
    claimTx: '0x4d4cfb5cd23f47293ae552e5776272fa711ae70e35fae17b23b372aaf93ea0fe'
  },
  {
    token: '0x78dA79F379be15E1f5F3020da611010CF9E7cb17',
    name: 'Rexi Test Launch (superseded launchpad)',
    symbol: 'RTEST',
    supply: '1000000',
    rewardAsset: REXI_REWARD_ASSET,
    creator: '0x0183eb7aD3ac108F083f4905b5c85E0e1A5AFf5B',
    launchpad: '0x22F4fdfF29411E7E0a136A2d3802Dd96a3B52cC0',
    createTx: null,
    distributeTx: null,
    claimTx: null
  }
];

export function explorerAddressUrl(address) {
  return `${REXI_NETWORK.blockExplorerUrl}/address/${address}`;
}

export function explorerTxUrl(hash) {
  return `${REXI_NETWORK.blockExplorerUrl}/tx/${hash}`;
}

export function shortAddress(address, size = 4) {
  if (typeof address !== 'string' || address.length < size * 2 + 2) return address || '';
  return `${address.slice(0, size + 2)}…${address.slice(-size)}`;
}

export function rewardAssetByAddress(address) {
  if (!address) return null;
  const needle = address.toLowerCase();
  return REXI_REWARD_ASSETS.find(a => a.address.toLowerCase() === needle) || null;
}

/** True when the value looks like a deployed contract address. */
export function isAddress(value) {
  return typeof value === 'string' && /^0x[0-9a-fA-F]{40}$/.test(value);
}