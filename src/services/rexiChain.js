import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { ROBINHOOD_CHAIN_TESTNET, REXI_LAUNCHPAD_TESTNET, REXI_TEST_STOCK_TOKEN_TESTNET } from './robinhoodChain';

const chain = { id: ROBINHOOD_CHAIN_TESTNET.chainIdDecimal, name: ROBINHOOD_CHAIN_TESTNET.chainName, nativeCurrency: ROBINHOOD_CHAIN_TESTNET.nativeCurrency, rpcUrls: { default: { http: ROBINHOOD_CHAIN_TESTNET.rpcUrls } } };
const abi = [{ type: 'function', name: 'createLaunch', stateMutability: 'nonpayable', inputs: [{ name: 'name', type: 'string' }, { name: 'symbol', type: 'string' }, { name: 'rewardAsset', type: 'address' }, { name: 'supply', type: 'uint256' }], outputs: [{ type: 'address' }] }, { type: 'function', name: 'distribute', stateMutability: 'nonpayable', inputs: [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [] }, { type: 'function', name: 'claim', stateMutability: 'nonpayable', inputs: [{ name: 'token', type: 'address' }], outputs: [] }];
const erc20Abi = [{ type: 'function', name: 'approve', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] }];

async function wallet() {
  if (!window.ethereum) throw new Error('Connect Robinhood Wallet or MetaMask first.');
  const client = createWalletClient({ chain, transport: custom(window.ethereum) });
  const [account] = await client.requestAddresses();
  return { client, account };
}

async function wait(hash) {
  const publicClient = createPublicClient({ chain, transport: http(ROBINHOOD_CHAIN_TESTNET.rpcUrls[0]) });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function createRexiLaunch({ name, symbol, rewardAsset, supply }) {
  const { client, account } = await wallet();
  const hash = await client.writeContract({ address: REXI_LAUNCHPAD_TESTNET, abi, functionName: 'createLaunch', account, args: [name, symbol, rewardAsset, BigInt(supply) * 10n ** 18n] });
  await wait(hash);
  return { hash, account };
}

export async function approveRewards(amount) {
  const { client, account } = await wallet();
  return wait(await client.writeContract({ address: REXI_TEST_STOCK_TOKEN_TESTNET, abi: erc20Abi, functionName: 'approve', account, args: [REXI_LAUNCHPAD_TESTNET, BigInt(amount) * 10n ** 18n] }));
}

export async function distributeRewards(token, amount) {
  const { client, account } = await wallet();
  return wait(await client.writeContract({ address: REXI_LAUNCHPAD_TESTNET, abi, functionName: 'distribute', account, args: [token, BigInt(amount) * 10n ** 18n] }));
}

export async function claimRewards(token) {
  const { client, account } = await wallet();
  return wait(await client.writeContract({ address: REXI_LAUNCHPAD_TESTNET, abi, functionName: 'claim', account, args: [token] }));
}
