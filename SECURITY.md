# Rexi security review — reward accounting

Scope: `contracts/RexiLaunchpad.sol` (`RexiLaunchpad`, `RexiToken`,
`RexiTestStockToken`), reward distribution/claim accounting and the token
transfer hook. Reviewed 2026-09-16, testnet only. Status: **findings fixed and
covered by `test/RexiLaunchpadSecurity.t.sol` (18 tests)**. This is an internal
review, not an independent audit — mainnet still requires one.

## Model

`distribute(token, amount)` pulls a reward asset, credits 67.5% to a per-launch
bucket, and raises `accRewardPerToken` by `bucket × ACC_SCALE / totalSupply`.
A holder's claim is `balance × accRewardPerToken / ACC_SCALE − rewardDebt`.
`beforeTokenTransfer` re-bases each side's debt so unclaimed rewards survive
balance changes. Invariants the suite enforces:

- I1: Σ pending ≤ `rewardBalance` ≤ contract asset balance (no insolvency).
- I2: a transfer never increases total claimable (no double claim).
- I3: a transfer never destroys a holder's own earned pending beyond the
      accrual attributable to the tokens that moved.
- I4: the split of every distribution is exactly 67.5 / 5 / 10 / 10 / 7.5 of
      what was actually received.

## Findings (all fixed)

### R1 — Critical: transfers destroyed unclaimed rewards
The old `beforeTokenTransfer` settled sender **and receiver** to their full
accrued amount before the balance moved. Receiving even 1 wei of a launch token
collapsed the recipient's pending to ~0, as did sending or self-transferring.
Demonstrated by tests (`337.5e18 → 0`), e.g. `test_recipient_keepsPendingWhenReceiving`.
**Fix:** `_carryPending` re-bases debt to `accrued(after) − pending(before)`,
so each side keeps its own earned pending (bounded by the accrued value of the
remaining balance). Covered by five transfer tests plus the double-claim
regression `test_claimedHistoryDoesNotTransfer`.

### R2 — Medium: `setTransferHook` was unguarded
Anyone could point a freshly deployed RexiToken's hook at an arbitrary contract
before the launchpad wired it. **Fix:** only the token's `deployer` may set the
hook, and only once (`test_hook_onlyDeployerCanSet`).

### R3 — Medium: `distribute` trusted the nominal amount
A reward asset that under-delivers (fee on transfer) inflated the holder bucket
beyond the contract's real balance, stranding or stealing the shared asset
balance across launches. **Fix:** the deposit is measured as the balance delta
around the pull; all splits use what actually arrived
(`test_feeOnTransfer_assetIsMeasuredNotAssumed`).

### R4 — Low: `createLaunch(supply = 0)` bricked a launch
Every later `distribute` divides by `totalSupply`, so a zero-supply launch could
never distribute. **Fix:** rejected up front with `ZeroSupply`
(`test_zeroSupply_rejected`).

### R5 — Low: no reentrancy guard
`distribute`/`claim` call out to an arbitrary reward asset. State ordering
already prevented corruption (the reentrancy test passed pre-fix), but a guard
was added as defence in depth (`ReentrantCall`).

## Remaining limitations (accepted for testnet)

- **L1 — attribution on transfers is imprecise.** Pending is preserved per
  address, but the accrual attributable to transferred tokens is forfeited by
  the sender unless claimed first, and a receiver never inherits the sender's
  claimed history. Value is conserved (I1/I2 hold) but per-user attribution can
  drift across chained transfers after several distributions.
- **L2 — reward assets must be standard ERC-20s.** An asset that fees outbound
  transfers burns part of every payout (607.5 accounted, 546.75 delivered in the
  test); large buckets could become unpayable. Inbound under-delivery is
  handled; outbound is not.
- **L3 — platform-operations share is untracked.** The residual 7.5% stays in
  the contract with no ledger or withdrawal path.
- **L4 — `RexiTestStockToken.mint` is unrestricted** by design; it is a testnet
  stand-in for a tokenised stock and must never hold real value.
- **L5 — the launchpad is trust-agnostic about reward assets.** A malicious
  asset can waste gas or revert, but cannot corrupt accounting (I1–I4 hold).

## Monitoring (live)

Two independent checks, both covering every launchpad including superseded ones:

| Check | Implementation | Invariant |
| --- | --- | --- |
| Accounting drift | `GET /api/chain/health`, `node script/monitor.mjs` | per launch `rewardBalance == Σ holderAmounts − Σ claims` |
| Asset solvency | same | per reward asset `balance ≥ Σ buckets` |

`monitor.mjs` exits non-zero on drift (cron-friendly) and `/api/chain/health` returns
503 with `status:"drift"` so uptime monitoring can alert. Current state: **ok** —
6 launches across 3 launchpads, 0 drift, 0 insolvent assets.

## Audit package

For an external reviewer, in order of importance:

1. `contracts/RexiLaunchpad.sol` — whole file (token, hook interface, launchpad, test token).
2. `test/RexiLaunchpadSecurity.t.sol` — 18 tests encoding invariants I1–I4; run with
   `forge test --match-contract RexiLaunchpadSecurityTest`.
3. `src/services/deployments.js` + `DEPLOYMENTS.md` — deployed addresses and evidence.
4. `server/routes/chain.mjs` — off-chain indexer and drift audit.
5. Known-and-accepted limitations below (L1–L5) and the reward model at the top of this file.

Suggested focus areas for the reviewer: the `_carryPending` debt re-basing arithmetic
(floor-division edge cases, self-transfers, zero-acc early return), `distribute`'s
balance-delta measurement, the residual platform-ops share (L3), and whether the
accumulator's rounding can be gamed across many small distributions.

## Mainnet gate

Do not deploy to mainnet until **all** of these hold:

- [ ] independent audit of `contracts/RexiLaunchpad.sol` and the tests passes
- [ ] L1–L3 either formally accepted or fixed; L4 replaced by real Robinhood stock tokens
- [ ] reward assets are canonical Robinhood stock tokens with verified deployers and
      standard ERC-20 semantics (no transfer fee, no blacklist, no rebasing)
- [ ] `REXI_MAINNET` in `src/services/deployments.js` is filled in (chainId 4663) and the
      placeholders replaced
- [ ] monitoring runs on a schedule with alerting on `/api/chain/health` drift
- [ ] treasury and ownership keys are behind a multisig, not a single EOA
- [ ] a bug bounty and an incident-response runbook exist
