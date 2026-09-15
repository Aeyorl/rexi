export const ROBINHOOD_CHAIN_TESTNET = {
  chainId: '0xb5e6',
  chainIdDecimal: 46630,
  chainName: 'Robinhood Chain Testnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: ['https://rpc.testnet.chain.robinhood.com'],
  blockExplorerUrls: ['https://explorer.testnet.chain.robinhood.com']
};

export const REXI_LAUNCHPAD_TESTNET = '0x22F4fdfF29411E7E0a136A2d3802Dd96a3B52cC0';
export const REXI_TEST_STOCK_TOKEN_TESTNET = '0x741Dd50A3D166589e870615c9B2D482DA800a0C3';

export async function connectRobinhoodChain() {
  if (!window.ethereum) throw new Error('Install an EVM wallet such as Robinhood Wallet to continue.');
  const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' });
  try {
    await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: ROBINHOOD_CHAIN_TESTNET.chainId }] });
  } catch (error) {
    if (error.code !== 4902) throw error;
    await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [ROBINHOOD_CHAIN_TESTNET] });
  }
  return address;
}
