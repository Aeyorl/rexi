# Rexi deployments — Robinhood Chain Testnet

Everything here is testnet-only. No mainnet deployment exists.

## Network

| Setting | Value |
| --- | --- |
| Chain ID | `46630` (`0xb5e6`) |
| RPC | `https://rpc.testnet.chain.robinhood.com` |
| Explorer | `https://explorer.testnet.chain.robinhood.com` |

## Canonical addresses

These are declared once in [`src/services/deployments.js`](src/services/deployments.js) and
imported by the frontend, the API routes and the scripts. Change them there only.

| Contract | Address | Notes |
| --- | --- | --- |
| RexiLaunchpad | `0xabaAd57e9Dbb401356c0b03d724c2714056e7dA0` | Post-security-review build; verified to match `contracts/RexiLaunchpad.sol` |
| rAAPL reward asset | `0x741Dd50A3D166589e870615c9B2D482DA800a0C3` | `RexiTestStockToken`, mintable testnet stand-in |
| RXG launch token | `0x6ec53eb68b8f6b528cb8801af1001794d3e934e8` | "Rexi Genesis", 1,000,000 supply, pays rAAPL, live on the current launchpad |

Treasuries receiving the non-holder share are set at deploy time from `.env`
(`REXI_PROTOCOL_TREASURY`, `REXI_DESKS_TREASURY`, `REXI_BUYBACK_TREASURY`).

## Superseded

| Contract | Address | Status |
| --- | --- | --- |
| RexiLaunchpad (security-review build) | `0x22F4fdfF29411E7E0a136A2d3802Dd96a3B52cC0` | Superseded by the R1–R5 fixes in [`SECURITY.md`](SECURITY.md). Its launches are frozen; holders there can no longer claim. |
| RexiLaunchpad (first) | `0xfd9FD9Ba704e5395D591b0d36CF682061e318F90` | Superseded by the hardened reward-accounting build. |

## Live evidence (current launchpad)

| Step | Transaction |
| --- | --- |
| `createLaunch` — RXG | `0x171b032ef039a3f1aeb4dc8c864422dce219c58ec897bd6fdb4f210f38d94496` |
| `distribute` — 1,000 rAAPL | `0x7cd16c664944eeab6d8cf6e5810a2ac00ef1f516fca2373805433bbfe1ae0ca6` |
| `claim` — 675 rAAPL to holder | `0x9a9b963618bb74f85e1e495d6563301a3bda18b040c110e787e39cf8ac1cf910` |
| `distribute` — 1,000 rAAPL (675 claimable) | `0xa41d0b14dc547aea07cc3be3f72ae1cb2836b02b7a5486c213313fe13a403428` |

Observed split for a 1,000 rAAPL distribution: 675 to holders (67.5%), 50 protocol (5%),
100 desks (10%), 100 buybacks (10%), 75 retained (platform operations).

## How to re-verify

```powershell
# 1. On-chain runtime code matches this repository's contract source
powershell -ExecutionPolicy Bypass -File script/verify-deployment.ps1

# 2. Reward accounting holds (18 adversarial tests, see SECURITY.md)
forge test --match-contract RexiLaunchpadSecurityTest

# 3. Live state is consistent with the frontend read layer
node script/check-reads.mjs
```

`verify-deployment.ps1` rebuilds the contract, reads the deployed runtime code and
compares them with the immutable treasury slots masked out.

## What the app does with these

| Surface | Source |
| --- | --- |
| `GET /api/chain/launches` | Indexes `LaunchCreated`, `RewardsDistributed`, `RewardClaimed` and joins live contract state |
| `GET /api/chain/launches/:token` | Single launch detail |
| Explore page | Renders the indexed launches with explorer links |
| Rewards page | Reads holder balance, accrued/pending rewards, reward-asset balance and allowance, then calls `approve` + `distribute` and `claim` |
| Launch token page | Calls `createLaunch`, resolves the new token from the `LaunchCreated` event and links the transaction |

## Safety notes

- The reward accounting has had an **internal security review** — findings R1–R5
  are fixed and covered by `forge test --match-contract RexiLaunchpadSecurityTest`
  (see [`SECURITY.md`](SECURITY.md)). It is **not** an independent audit; mainnet
  remains gated on one.
- `RexiTestStockToken` exposes an unrestricted `mint`. It is a stand-in for a
  tokenised stock and must never be used on mainnet.
- No official Robinhood Chain testnet stock tokens exist yet, which is why rAAPL
  is used instead.