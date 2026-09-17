# Rexi — Robinhood Chain Token Launchpad

> **Live in Production on Robinhood Chain Mainnet (`Chain ID: 4663`)**: [https://rexi-launchpad.vercel.app](https://rexi-launchpad.vercel.app)

**Rexi** is a token launchpad purpose-built for Robinhood Chain. Creators launch ERC-20 tokens backed by real-world and crypto reward dividends (**Apple Stock $AAPL**, **Tesla Stock $TSLA**, **Wrapped Ether $WETH**, or **Global Dollar $USDG**). Holders continuously accrue rewards pro-rata to their holdings without locking or staking.

---

## ⚡ Quick Links & Documentation
* 📖 **[Full Technical & Operational Documentation](DOCUMENTATION.md)** — Complete architecture, dividend math, and contract mechanics.
* 📜 **[Deployments & On-Chain Proofs](DEPLOYMENTS.md)** — Mainnet & testnet contract addresses, transaction hashes, and verified treasuries.
* 🛡️ **[Security Model & Invariants](SECURITY.md)** — Reentrancy guards, transfer-hook verifications, and audit status.

---

## 💎 Canonical Mainnet Deployments

| Component | Address / Link |
| :--- | :--- |
| **Network** | **Robinhood Chain Mainnet** (`Chain ID: 4663`) |
| **Live App** | [https://rexi-launchpad.vercel.app](https://rexi-launchpad.vercel.app) |
| **Canonical Launchpad** | [`0x011a50Bd4Ac29c90513728da693E69cAB678111e`](https://explorer.chain.robinhood.com/address/0x011a50Bd4Ac29c90513728da693E69cAB678111e) |
| **Genesis Token ($OWEGO)** | [`0x65DaF75eef96316C5b38C8D928106Ea371D9a0fA`](https://explorer.chain.robinhood.com/address/0x65DaF75eef96316C5b38C8D928106Ea371D9a0fA) |
| **Protocol Treasury** | [`0xa5e7d6C189b37D9293908E0A28Da4D65d65a7f7A`](https://explorer.chain.robinhood.com/address/0xa5e7d6C189b37D9293908E0A28Da4D65d65a7f7A) |
| **Desks Treasury** | [`0x913B8D346625736958664C77b0C8Efd3DA2a7bA2`](https://explorer.chain.robinhood.com/address/0x913B8D346625736958664C77b0C8Efd3DA2a7bA2) |
| **Buyback Treasury** | [`0x8cA71B70C91BD8250073dfDD323b9219Bce6A165`](https://explorer.chain.robinhood.com/address/0x8cA71B70C91BD8250073dfDD323b9219Bce6A165) |

### Supported Reward Assets
* **$AAPL** — `0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9` (18 decimals)
* **$TSLA** — `0x322F0929c4625eD5bAd873c95208D54E1c003b2d` (18 decimals)
* **$WETH** — `0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73` (18 decimals)
* **$USDG** — `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168` (6 decimals)

---

## 💰 Fee Split Distribution

Every reward deposit into `RexiLaunchpad.distribute()` splits automatically:
* **67.5%** — Pro-rata dividend pool for token holders
* **10.0%** — Desks Treasury
* **10.0%** — Rexi Buyback Treasury
* **5.0%** — Protocol Treasury
* **7.5%** — Platform Operations & Retained Buffer

---

## 🚀 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Run backend API indexer (port 4000)
npm run server

# 3. Run frontend with Vite HMR (port 5173)
npm run dev
```

---

## 📡 Live Production API

Unified serverless Express endpoints available at `https://rexi-launchpad.vercel.app`:
* `GET /api/health` — Service status, active chain ID, and canonical launchpad address.
* `GET /api/chain/launches` — Real-time catalog of all token launches and reward totals.
* `GET /api/chain/launches/:token` — Single token detail and historical payouts.
* `GET /api/chain/activity` — Cumulative financial ledger and treasury balances.
* `GET /api/chain/health` — On-chain invariant solvency validation.

---

## 🧪 Smart Contract Verification & Testing

```powershell
# Run security test suite covering R1-R5 invariants
forge test --match-contract RexiLaunchpadSecurityTest -vvv

# Verify local bytecode matches Robinhood Chain deployment
powershell -ExecutionPolicy Bypass -File script/verify-deployment.ps1
```
