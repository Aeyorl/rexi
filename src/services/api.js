/**
 * Rexi frontend API client.
 */

const API_BASE = '/api';

/**
 * Full Robinhood Chain index: launches, aggregate stats, recent distributions
 * and the launchpad address. Returns null when the index route is unreachable.
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

export async function fetchTokens({ search = '', sort = 'FDV' } = {}) {
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (sort) params.append('sort', sort);
    const res = await fetch(`${API_BASE}/tokens?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.data;
  } catch (err) {
    console.warn('Backend fetchTokens failed, falling back', err);
    return null;
  }
}

export async function launchToken(tokenData) {
  const res = await fetch(`${API_BASE}/tokens/launch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tokenData)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to launch token');
  }
  return res.json();
}

export async function fetchRobinhoodAccount() {
  try {
    const res = await fetch(`${API_BASE}/robinhood/account`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.data;
  } catch (err) {
    console.warn('Backend fetchRobinhoodAccount failed', err);
    return null;
  }
}

export async function submitRobinhoodOrder(orderData) {
  const res = await fetch(`${API_BASE}/robinhood/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Order execution failed');
  }
  return res.json();
}

export async function depositRobinhoodFunds(amount) {
  const res = await fetch(`${API_BASE}/robinhood/deposit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Deposit failed');
  }
  return res.json();
}

export async function fetchStockQuotes() {
  try {
    const res = await fetch(`${API_BASE}/stocks`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.data;
  } catch (err) {
    console.warn('Backend fetchStockQuotes failed', err);
    return null;
  }
}

export async function claimDividends() {
  const res = await fetch(`${API_BASE}/stocks/meta/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Claim failed');
  return res.json();
}
