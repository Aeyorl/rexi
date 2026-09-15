import { Router } from 'express';
import { createPublicClient, http, parseAbiItem } from 'viem';

const router = Router();
const launchpad = process.env.REXI_LAUNCHPAD_TESTNET || '0x22F4fdfF29411E7E0a136A2d3802Dd96a3B52cC0';
const rpcUrl = process.env.RH_RPC_URL || 'https://rpc.testnet.chain.robinhood.com';
const client = createPublicClient({ transport: http(rpcUrl) });
const launchCreated = parseAbiItem('event LaunchCreated(address indexed token,address indexed rewardAsset,address indexed creator,uint256 supply)');

router.get('/launches', async (_req, res) => {
  try {
    const logs = await client.getLogs({ address: launchpad, event: launchCreated, fromBlock: 'earliest', toBlock: 'latest' });
    res.json({ success: true, chainId: 46630, launchpad, data: logs.map(({ args, transactionHash, blockNumber }) => ({ ...args, transactionHash, blockNumber: blockNumber?.toString() })) });
  } catch (error) {
    res.status(502).json({ success: false, error: 'Robinhood Chain RPC unavailable', detail: error.message });
  }
});

export default router;
