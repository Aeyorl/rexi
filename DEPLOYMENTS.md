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
| RexiLaunchpad | `0x22F4fdfF29411E7E0a136A2d3802Dd96a3B52cC0` | Verified to match `contracts/RexiLaunchpad.sol` at `HEAD` |
| rAAPL reward asset | `0x741Dd50A3D166589e870615c9B2D482DA800a0C3` | `RexiTestStockToken`, mintable testnet stand-in |
| RXG launch token | `0xA1bcc84b5D389aD3d96EFb3360A0EA44B8aa57C7` | "Rexi Genesis", 1,000,000 supply, pays rAAPL |

Treasuries receiving the non-holder share are set at deploy time from `.env`
(`REXI_PROTOCOL_TREASURY`, `REXI_DESKS_TREASURY`, `REXI_BUYBACK_TREASURY`).

## Superseded

| Contract | Address | Status |
| --- | --- | --- |
| RexiLaunchpad (first) | `0xfd9FD9Ba704e5395D591b0d36CF682061e318F90` | Superseded by the hardened reward-accounting build. Kept in `REXI_SUPERSEDED_DEPLOYMENTS` for historical lookup. |

## Live evidence

Recorded on the canonical launchpad (newest first):

| Step | Transaction |
| --- | --- |
| `createLaunch` — RXG | `0x80b1bc2949b476584fbe5dedf283d6e997efd839f7e5f3d0c4855618e9703b62` |
| `distribute` — 1,000 rAAPL | `0x7b97eb490cf762be3e82000955b77bbe8faef1c13509055166375635d29bac44` |
| `claim` — 675 rAAPL to holder | `0x4d4cfb5cd23f47293ae552e5776272fa711ae70e35fae17b23b372aaf93ea0fe` |
| `distribute` — 1,000 rAAPL (leaves 675 claimable) | `0x294a1eb6494af5d43a426fa15e513488dd64074921853578f3eae45330f32b38` |

Observed split for a 1,000 rAAPL distribution: 675 to holders (67.5%), 50 protocol (5%),
100 desks (10%), 100 buybacks (10%), 75 retained (platform operations).

## How to re-verify

```powershell
# 1. On-chain runtime code matches this repository's contract source
powershell -ExecutionPolicy Bypass -File script/verify-deployment.ps1

# 2. Live state is consistent with the frontend read layer
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

- The reward accounting is an **initial testnet prototype**; the accumulator in
  `RexiLaunchpad.sol` has not had an independent security review.
- `RexiTestStockToken` exposes an unrestricted `mint`. It is a stand-in for a
  tokenised stock and must never be used on mainnet.
- No official Robinhood Chain testnet stock tokens exist yet, which is why rAAPL
  is used instead.