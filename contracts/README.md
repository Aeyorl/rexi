# Rexi contracts

`RexiLaunchpad.sol` is the initial Robinhood Chain Testnet implementation.

Network configuration:

- Chain ID: `46630`
- RPC: `https://rpc.testnet.chain.robinhood.com`
- Explorer: `https://explorer.testnet.chain.robinhood.com`

Build locally with:

```sh
forge build
```

Deployment requires three treasury addresses and a throwaway testnet deployer
key. Never commit a private key. Mainnet deployment is intentionally out of
scope until the contract has independent security review and testnet evidence.

The reward accounting is an initial testnet prototype. Before production, token
transfer accounting must be reviewed so transfers cannot create or preserve
duplicate reward claims.
