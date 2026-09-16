/**
 * Robinhood Chain Testnet configuration.
 *
 * Network details and addresses live in `deployments.js` so the frontend, the
 * API routes and the scripts cannot drift apart. This module re-exports them
 * under the names the app already imports.
 */
import { REXI_NETWORK, REXI_LAUNCHPAD, REXI_REWARD_ASSET, REXI_REWARD_ASSETS } from './deployments.js';
export { explorerAddressUrl, explorerTxUrl, shortAddress } from './deployments.js';

export const ROBINHOOD_CHAIN_TESTNET = {
  chainId: REXI_NETWORK.chainId,
  chainIdDecimal: REXI_NETWORK.chainIdDecimal,
  chainName: REXI_NETWORK.chainName,
  nativeCurrency: REXI_NETWORK.nativeCurrency,
  rpcUrls: REXI_NETWORK.rpcUrls,
  blockExplorerUrls: REXI_NETWORK.blockExplorerUrls
};

/** Canonical RexiLaunchpad on Robinhood Chain Testnet. */
export const REXI_LAUNCHPAD_TESTNET = REXI_LAUNCHPAD;

/** Default reward asset (testnet stand-in for a tokenised stock). */
export const REXI_TEST_STOCK_TOKEN_TESTNET = REXI_REWARD_ASSET;

/** Every reward asset a launch may pay out with. */
export const REXI_REWARD_ASSET_LIST = REXI_REWARD_ASSETS;

export async function connectRobinhoodChain() {
  if (!window.ethereum) throw new Error('Install an EVM wallet such as Robinhood Wallet to continue.');
  const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' });
  const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
  if (currentChainId?.toLowerCase() === ROBINHOOD_CHAIN_TESTNET.chainId.toLowerCase()) return address;
  try {
    await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: ROBINHOOD_CHAIN_TESTNET.chainId }] });
  } catch (error) {
    if (error.code !== 4902) throw error;
    // EIP-3085: only these keys are accepted — anything extra (e.g. our own
    // chainIdDecimal) makes wallets reject the request.
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: ROBINHOOD_CHAIN_TESTNET.chainId,
        chainName: ROBINHOOD_CHAIN_TESTNET.chainName,
        nativeCurrency: ROBINHOOD_CHAIN_TESTNET.nativeCurrency,
        rpcUrls: ROBINHOOD_CHAIN_TESTNET.rpcUrls,
        blockExplorerUrls: ROBINHOOD_CHAIN_TESTNET.blockExplorerUrls
      }]
    });
  }
  return address;
}
