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

export const REXI_NETWORK = {
  chainId: '0xb5e6',
  chainIdDecimal: 46630,
  chainName: 'Robinhood Chain Testnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrl: 'https://rpc.testnet.chain.robinhood.com',
  rpcUrls: ['https://rpc.testnet.chain.robinhood.com'],
  blockExplorerUrl: 'https://explorer.testnet.chain.robinhood.com',
  blockExplorerUrls: ['https://explorer.testnet.chain.robinhood.com']
};

/** Current RexiLaunchpad. Matches contracts/RexiLaunchpad.sol at HEAD. */
export const REXI_LAUNCHPAD = '0x22F4fdfF29411E7E0a136A2d3802Dd96a3B52cC0';

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

/** @deprecated first testnet launchpad, kept for historical lookup only. */
export const REXI_SUPERSEDED_DEPLOYMENTS = [
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

/** Launches created on the canonical launchpad, newest first. */
export const REXI_GENESIS_LAUNCHES = [
  {
    token: '0xA1bcc84b5D389aD3d96EFb3360A0EA44B8aa57C7',
    name: 'Rexi Genesis',
    symbol: 'RXG',
    supply: '1000000000000000000000000',
    rewardAsset: REXI_REWARD_ASSET,
    creator: '0x0183eb7aD3ac108F083f4905b5c85E0e1A5AFf5B',
    createTx: '0x80b1bc2949b476584fbe5dedf283d6e997efd839f7e5f3d0c4855618e9703b62',
    distributeTx: '0x7b97eb490cf762be3e82000955b77bbe8faef1c13509055166375635d29bac44',
    claimTx: '0x4d4cfb5cd23f47293ae552e5776272fa711ae70e35fae17b23b372aaf93ea0fe'
  },
  {
    token: '0x78dA79F379be15E1f5F3020da611010CF9E7cb17',
    name: 'Rexi Test Launch',
    symbol: 'RTEST',
    supply: '1000000',
    rewardAsset: REXI_REWARD_ASSET,
    creator: '0x0183eb7aD3ac108F083f4905b5c85E0e1A5AFf5B',
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