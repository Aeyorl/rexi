# Rexi contracts

`RexiLaunchpad.sol` is the Robinhood Chain Testnet implementation.

Network configuration:

- Chain ID: `46630`
- RPC: `https://rpc.testnet.chain.robinhood.com`
- Explorer: `https://explorer.testnet.chain.robinhood.com`

Deployed address, live transaction evidence and the verification recipe are in
[`../DEPLOYMENTS.md`](../DEPLOYMENTS.md). Addresses are declared once in
[`../src/services/deployments.js`](../src/services/deployments.js).

Build locally with:

```sh
forge build
```

Deployment requires three treasury addresses and a throwaway testnet deployer
key. Never commit a private key. Mainnet deployment is intentionally out of
scope until the contract has independent security review and testnet evidence.

Verify that the deployed runtime code matches this source:

```powershell
powershell -ExecutionPolicy Bypass -File ../script/verify-deployment.ps1
```

## Reward accounting

`distribute(token, amount)` pulls `amount` of the launch's reward asset, credits
67.5% to holders through `accRewardPerToken`, pays 5% protocol / 10% desks / 10%
buybacks, and retains the remainder for platform operations.

`claim(token)` pays `balance * accRewardPerToken / ACC_SCALE - rewardDebt`, so a
holder's entitlement is bounded by their balance at claim time. Transfers settle
both sides through `beforeTokenTransfer` so moving tokens cannot duplicate or
erase an accrued claim.

This is still an initial testnet prototype: the accumulator has not had an
independent security review, and `RexiTestStockToken.mint` is unrestricted by
design so testnet rewards can be produced on demand.
