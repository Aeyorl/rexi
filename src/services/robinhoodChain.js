export const ROBINHOOD_CHAIN_TESTNET = {
  chainId: '0xb5e6',
  chainIdDecimal: 46630,
  chainName: 'Robinhood Chain Testnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: ['https://rpc.testnet.chain.robinhood.com'],
  blockExplorerUrls: ['https://explorer.testnet.chain.robinhood.com']
};

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
