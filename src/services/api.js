/**
 * Rexi frontend API client.
 *
 * The only backend surface is the real on-chain index
 * (server/routes/chain.mjs). No simulated data lives here.
 */

const API_BASE = '/api';

/**
 * Full Robinhood Chain index: launches across every indexed launchpad,
 * aggregate stats, recent distributions and the canonical launchpad address.
 * Returns null when the index route is unreachable.
 */
export async function fetchChainIndex() {
  try {
    const res = await fetch(`${API_BASE}/chain/launches`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Chain index fetch failed', err);
    return null;
  }
}

/** Convenience wrapper returning just the indexed launches array. */
export async function fetchChainLaunches() {
  const index = await fetchChainIndex();
  return index?.data ?? null;
}

/** Single launch detail (metadata, reward accounting, related distributions). */
export async function fetchChainLaunch(token) {
  try {
    const res = await fetch(`${API_BASE}/chain/launches/${token}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()).data;
  } catch (err) {
    console.warn('Chain launch detail fetch failed', err);
    return null;
  }
}

/**
 * Everything the finance pages show: cumulative fee splits from real
 * distributions, daily buckets and the treasury balances actually held
 * on-chain. Returns null when unreachable.
 */
export async function fetchChainActivity() {
  try {
    const res = await fetch(`${API_BASE}/chain/activity`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Chain activity fetch failed', err);
    return null;
  }
}

/** Liveness probe for the solvency audit. Null when the route is down. */
export async function fetchChainHealth() {
  try {
    const res = await fetch(`${API_BASE}/chain/health`);
    return await res.json();
  } catch (err) {
    console.warn('Chain health fetch failed', err);
    return null;
  }
}