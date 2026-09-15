import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { ROBINHOOD_CHAIN_TESTNET, REXI_LAUNCHPAD_TESTNET } from './robinhoodChain';

const chain = { id: ROBINHOOD_CHAIN_TESTNET.chainIdDecimal, name: ROBINHOOD_CHAIN_TESTNET.chainName, nativeCurrency: ROBINHOOD_CHAIN_TESTNET.nativeCurrency, rpcUrls: { default: { http: ROBINHOOD_CHAIN_TESTNET.rpcUrls } } };
const abi = [{ type: 'function', name: 'createLaunch', stateMutability: 'nonpayable', inputs: [{ name: 'name', type: 'string' }, { name: 'symbol', type: 'string' }, { name: 'rewardAsset', type: 'address' }, { name: 'supply', type: 'uint256' }], outputs: [{ type: 'address' }] }];

export async function createRexiLaunch({ name, symbol, rewardAsset, supply }) {
  if (!window.ethereum) throw new Error('Connect Robinhood Wallet or MetaMask first.');
  const wallet = createWalletClient({ chain, transport: custom(window.ethereum) });
  const [account] = await wallet.requestAddresses();
  const hash = await wallet.writeContract({ address: REXI_LAUNCHPAD_TESTNET, abi, functionName: 'createLaunch', account, args: [name, symbol, rewardAsset, BigInt(supply) * 10n ** 18n] });
  const publicClient = createPublicClient({ chain, transport: http(ROBINHOOD_CHAIN_TESTNET.rpcUrls[0]) });
  await publicClient.waitForTransactionReceipt({ hash });
  return { hash, account };
}
