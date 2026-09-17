# Rexi Deployments

## Robinhood Chain Mainnet (Live Production)

| Setting | Value |
| --- | --- |
| Network | **Robinhood Chain Mainnet** |
| Chain ID | `4663` (`0x1237`) |
| Primary RPC | Alchemy Mainnet RPC (`https://robinhood-mainnet.g.alchemy.com/v2/...`) |
| Fallback RPC | `https://rpc.chain.robinhood.com` |
| Block Explorer | [`https://explorer.chain.robinhood.com`](https://explorer.chain.robinhood.com) |
| Canonical Launchpad | [`0x011a50Bd4Ac29c90513728da693E69cAB678111e`](https://explorer.chain.robinhood.com/address/0x011a50Bd4Ac29c90513728da693E69cAB678111e) |
| Deployment Block | `65303659` |
| Deployment Tx | [`0xd36938865405dbc0dfdd4675a2a7117c8b50fa7ff09a492485080353958805bd`](https://explorer.chain.robinhood.com/tx/0xd36938865405dbc0dfdd4675a2a7117c8b50fa7ff09a492485080353958805bd) |
| Deployer | `0xa1CdabD686B0e822b01F526363ff70385e7743a4` |

### Configured Treasuries
* **Protocol Treasury (5%)**: [`0xa5e7d6C189b37D9293908E0A28Da4D65d65a7f7A`](https://explorer.chain.robinhood.com/address/0xa5e7d6C189b37D9293908E0A28Da4D65d65a7f7A)
* **Desks Treasury (10%)**: [`0x913B8D346625736958664C77b0C8Efd3DA2a7bA2`](https://explorer.chain.robinhood.com/address/0x913B8D346625736958664C77b0C8Efd3DA2a7bA2)
* **Buyback Treasury (10%)**: [`0x8cA71B70C91BD8250073dfDD323b9219Bce6A165`](https://explorer.chain.robinhood.com/address/0x8cA71B70C91BD8250073dfDD323b9219Bce6A165)

### Verified Canonical Mainnet Reward Assets
| Asset | Name | Contract Address | Decimals |
| :--- | :--- | :--- | :--- |
| **$AAPL** | Apple • Robinhood Token | [`0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9`](https://explorer.chain.robinhood.com/address/0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9) | `18` |
| **$TSLA** | Tesla • Robinhood Token | [`0x322F0929c4625eD5bAd873c95208D54E1c003b2d`](https://explorer.chain.robinhood.com/address/0x322F0929c4625eD5bAd873c95208D54E1c003b2d) | `18` |
| **$WETH** | Wrapped Ether | [`0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73`](https://explorer.chain.robinhood.com/address/0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73) | `18` |
| **$USDG** | Global Dollar (Paxos / Robinhood) | [`0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168`](https://explorer.chain.robinhood.com/address/0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168) | `6` |

### Mainnet Genesis Launch & Live Evidence
* **Genesis Token**: **`$OWEGO`** (OWEGO)
* **Token Address**: [`0x65DaF75eef96316C5b38C8D928106Ea371D9a0fA`](https://explorer.chain.robinhood.com/address/0x65DaF75eef96316C5b38C8D928106Ea371D9a0fA)
* **Supply**: `1,000,000 $OWEGO`
* **Creation Tx**: [`0x01452de773fbd695f65344ce3f6bad7dc31c47331e4fa7de3057ca34c2d2ad87`](https://explorer.chain.robinhood.com/tx/0x01452de773fbd695f65344ce3f6bad7dc31c47331e4fa7de3057ca34c2d2ad87) (Block `65385305`)
* **First Distribution Tx**: [`0xf114f4e21064b78e8e3cd85090ef09ada35073a38652092155d943f984549b82`](https://explorer.chain.robinhood.com/tx/0xf114f4e21064b78e8e3cd85090ef09ada35073a38652092155d943f984549b82) (Block `65388600`)
* **Gross Distributed**: `0.0001 WETH` (67.5% directly to holders, 10% Desks, 10% Buybacks, 5% Protocol, 7.5% Ops)

---

## Robinhood Chain Testnet

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

## Launchpad rotation procedure

Rolling out a new launchpad must not orphan existing launches:

1. Deploy via `script/deploy-testnet.ps1`.
2. Update `REXI_LAUNCHPAD` in [`src/services/deployments.js`](src/services/deployments.js) and
   move the previous address into `REXI_SUPERSEDED_DEPLOYMENTS` with a note saying why.
3. Update the canonical section of this file with the new address and evidence.
4. Verify: `script/verify-deployment.ps1` (new address), `node script/check-reads.mjs`,
   `node script/monitor.mjs`.
5. Recreate at least one launch on the new launchpad so the index and the Explore
   page are not empty.

Because the API indexes the canonical launchpad **and** every entry in
`REXI_SUPERSEDED_DEPLOYMENTS`, launches on old deployments stay visible in the UI and
remain claimable/distributable — each launch is tagged `legacy` and the app routes
every write to the launchpad that actually holds it. Superseded launchpads keep working
on-chain; nothing is frozen as long as they stay listed.

## Monitoring and drift checks

| Check | Command | What it proves |
| --- | --- | --- |
| Accounting drift | `node script/monitor.mjs` | per launch: `rewardBalance == Σ holderAmounts − Σ claims` |
| Asset solvency | `node script/monitor.mjs` | per reward asset: contract balance ≥ Σ of its buckets |
| HTTP probe | `GET /api/chain/health` | same two checks, 200 `status:"ok"` or 503 `status:"drift"` |

`monitor.mjs` exits non-zero on drift, so it can run from cron or a scheduled agent.
`/api/chain/health` is the same audit exposed over HTTP for uptime monitoring.

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