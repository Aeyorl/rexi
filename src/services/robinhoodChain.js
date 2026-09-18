/**
 * Robinhood Chain configuration & wallet connection.
 *
 * Automatically targets Robinhood Chain Mainnet or Testnet based on active configuration.
 */
import {
  ACTIVE_NETWORK,
  ACTIVE_LAUNCHPAD,
  ACTIVE_REWARD_ASSET,
  ACTIVE_REWARD_ASSETS,
  REXI_NETWORK,
  REXI_LAUNCHPAD,
  REXI_REWARD_ASSET,
  REXI_REWARD_ASSETS
} from './deployments.js';
export { explorerAddressUrl, explorerTxUrl, shortAddress } from './deployments.js';

export const ACTIVE_CHAIN = {
  chainId: ACTIVE_NETWORK.chainId,
  chainIdDecimal: ACTIVE_NETWORK.chainIdDecimal,
  chainName: ACTIVE_NETWORK.chainName,
  nativeCurrency: ACTIVE_NETWORK.nativeCurrency,
  rpcUrls: ACTIVE_NETWORK.rpcUrls,
  blockExplorerUrls: ACTIVE_NETWORK.blockExplorerUrls
};

export const ROBINHOOD_CHAIN_TESTNET = {
  chainId: REXI_NETWORK.chainId,
  chainIdDecimal: REXI_NETWORK.chainIdDecimal,
  chainName: REXI_NETWORK.chainName,
  nativeCurrency: REXI_NETWORK.nativeCurrency,
  rpcUrls: REXI_NETWORK.rpcUrls,
  blockExplorerUrls: REXI_NETWORK.blockExplorerUrls
};

/** Active Bool launchpad contract address. */
export const ACTIVE_LAUNCHPAD_ADDRESS = ACTIVE_LAUNCHPAD;
export const REXI_LAUNCHPAD_TESTNET = REXI_LAUNCHPAD;

/** Active reward assets list. */
export const REXI_REWARD_ASSET_LIST = ACTIVE_REWARD_ASSETS;
export const REXI_TEST_STOCK_TOKEN_TESTNET = ACTIVE_REWARD_ASSET;

/** Switches the injected wallet to the active Robinhood Chain, adding it only if needed. */
async function ensureRobinhoodChain() {
  const target = ACTIVE_CHAIN.chainId.toLowerCase();

  const whereAreWe = async () => {
    const current = await window.ethereum.request({ method: 'eth_chainId' });
    return typeof current === 'string' ? current.toLowerCase() : null;
  };

  if ((await whereAreWe()) === target) return;

  try {
    await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: ACTIVE_CHAIN.chainId }] });
    if ((await whereAreWe()) === target) return;
  } catch {
    // 4902 means "unknown chain", but some wallets also throw other codes here
    // even when the chain exists — fall through to add-then-switch.
  }

  try {
    // EIP-3085: only these keys are accepted — anything extra (e.g. our own
    // chainIdDecimal) makes wallets reject the request.
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: ACTIVE_CHAIN.chainId,
        chainName: ACTIVE_CHAIN.chainName,
        nativeCurrency: ACTIVE_CHAIN.nativeCurrency,
        rpcUrls: ACTIVE_CHAIN.rpcUrls,
        blockExplorerUrls: ACTIVE_CHAIN.blockExplorerUrls
      }]
    });
  } catch {
    // A duplicate-network rejection here is harmless: the chain already exists
    // in the wallet. Decide based on where we actually are, not on the error.
  }

  if ((await whereAreWe()) === target) return;
  await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: ACTIVE_CHAIN.chainId }] });
  if ((await whereAreWe()) !== target) {
    throw new Error(`Wallet did not switch to ${ACTIVE_CHAIN.chainName}. Switch to chain ${ACTIVE_CHAIN.chainIdDecimal} manually and reconnect.`);
  }
}

export async function connectRobinhoodChain() {
  if (!window.ethereum) throw new Error('Install an EVM wallet such as Robinhood Wallet or MetaMask to continue.');
  const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' });
  await ensureRobinhoodChain();
  return address;
}
