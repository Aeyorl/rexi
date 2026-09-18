import { useState, useEffect } from 'react';
import { fetchChainIndex } from '../services/api';
import { ACTIVE_NETWORK, shortAddress } from '../services/deployments';
import './Explore.css';

const FILTERS = ['Recent', 'Distributed', 'Claims'];

export default function Explore({ onNavigate }) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('Recent');
  const [page, setPage] = useState(1);
  const [chainIndex, setChainIndex] = useState(null);
  const [copiedToken, setCopiedToken] = useState(null);
  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    let active = true;
    async function loadChain() {
      const index = await fetchChainIndex();
      if (active && index) setChainIndex(index);
    }
    loadChain();
    return () => { active = false; };
  }, []);

  const copyAddress = (e, address) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard?.writeText(address);
    setCopiedToken(address);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const chainLaunches = chainIndex?.data ?? [];
  const chainStats = chainIndex?.stats ?? null;

  const query = search.toLowerCase().trim();
  const filteredChain = chainLaunches.filter(l =>
    !query
    || (l.symbol || '').toLowerCase().includes(query)
    || (l.name || '').toLowerCase().includes(query)
    || (l.token || '').toLowerCase().includes(query)
  );

  const sortedChain = [...filteredChain].sort((a, b) => {
    if (activeFilter === 'Distributed') return Number(b.distributedRaw ?? 0) - Number(a.distributedRaw ?? 0);
    if (activeFilter === 'Claims') return (b.claimCount || 0) - (a.claimCount || 0);
    return Number(b.blockNumber ?? 0) - Number(a.blockNumber ?? 0);
  });

  const totalPages = Math.max(1, Math.ceil(sortedChain.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pagedChain = sortedChain.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  return (
    <div className="explore">
      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-art" aria-hidden="true">
          <div className="hero-art-track">
            <div className="hero-art-layer" />
            <div className="hero-art-layer" />
          </div>
        </div>
        <div className="hero-left">
          <h1 className="hero-title">Launch tokens that reward stocks.</h1>
          <p className="hero-subtitle">
            Deploy ERC-20 tokens on {ACTIVE_NETWORK.chainName} with continuous pro-rata stock dividend payouts.
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => onNavigate('Launch token')}>
              <span className="plus">+</span> Launch a token
            </button>
            <button className="btn-ghost" onClick={() => onNavigate('Rewards')}>
              How it works →
            </button>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-val">{chainStats?.launchCount ?? '—'}</span>
              <span className="hero-stat-label">Launches on-chain</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-val">{chainStats?.distributions ?? '—'}</span>
              <span className="hero-stat-label">Reward distributions</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-val">{chainStats?.holderPayouts ?? '—'}</span>
              <span className="hero-stat-label">Holder payouts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Catalog Header & Controls */}
      <div className="catalog-header">
        <div className="catalog-title-wrap">
          <h2 className="catalog-title">Robinhood Chain Launches</h2>
          <span className="catalog-sub">
            {chainStats ? `${filteredChain.length} token${filteredChain.length === 1 ? '' : 's'} on-chain` : 'Reading chain…'}
          </span>
        </div>

        <div className="token-controls">
          <div className="search-wrap">
            <svg className="search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              className="search-input"
              placeholder="Search by symbol, name, or address..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="filter-group">
            {FILTERS.map(f => (
              <button
                key={f}
                className={`filter-btn ${activeFilter === f ? 'active' : ''}`}
                onClick={() => { setActiveFilter(f); setPage(1); }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Token Grid */}
      <div className="token-grid">
        {filteredChain.length === 0 && (
          <div className="chain-empty">
            {chainIndex ? 'No launches match your search.' : 'Reading the launchpad from Robinhood Chain...'}
          </div>
        )}
        {pagedChain.map(launch => (
          <div key={launch.token} className="token-card animate-in">
            <div className="token-card-header">
              <div className="token-avatar">
                <span className="token-avatar-text">{(launch.symbol || '??').slice(0, 3).toUpperCase()}</span>
              </div>
              <div className="token-meta">
                <div className="token-symbol-row">
                  <span className="token-symbol">${launch.symbol || 'unknown'}</span>
                  <span className={`token-badge ${launch.active ? 'live' : 'closed'}`}>
                    {launch.active ? '● LIVE' : 'CLOSED'}
                  </span>
                </div>
                <span className="token-name">{launch.name || 'Unnamed launch'}</span>
              </div>
              <a
                href={launch.tokenUrl}
                target="_blank"
                rel="noreferrer"
                className="token-ext-link"
                title="View on Robinhood Chain Explorer"
              >
                Explorer ↗
              </a>
            </div>

            <div className="token-metrics">
              <div className="token-metric-row">
                <span className="metric-label">Supply</span>
                <span className="metric-val">{Number(launch.supplyFormatted ?? 0).toLocaleString()} ${launch.symbol}</span>
              </div>
              <div className="token-metric-row">
                <span className="metric-label">Pays Dividends In</span>
                <span className="metric-val accent">
                  {launch.rewardAssetSymbol === 'AAPL' ? '🍏 ' : (launch.rewardAssetSymbol === 'TSLA' ? '⚡ ' : (launch.rewardAssetSymbol === 'WETH' ? '💎 ' : (launch.rewardAssetSymbol === 'USDG' ? '💵 ' : '')))}
                  {launch.rewardAssetSymbol || 'reward asset'}
                </span>
              </div>
              <div className="token-metric-row">
                <span className="metric-label">Total Distributed</span>
                <span className="metric-val">
                  {launch.distributed && Number(launch.distributed) > 0 ? launch.distributed : '0'} {launch.rewardAssetSymbol}
                </span>
              </div>
              <div className="token-metric-row">
                <span className="metric-label">Claimed by Holders</span>
                <span className="metric-val">
                  {launch.claimed && Number(launch.claimed) > 0 ? launch.claimed : '0'} {launch.rewardAssetSymbol} ({launch.claimCount || 0} claims)
                </span>
              </div>
            </div>

            <div className="token-card-footer">
              <button
                className="token-address-btn"
                onClick={(e) => copyAddress(e, launch.token)}
                title="Copy token contract address"
              >
                <span>{shortAddress(launch.token, 4)}</span>
                <span className="copy-label">{copiedToken === launch.token ? '✓ Copied' : 'Copy'}</span>
              </button>
              <button
                className="btn-card-action"
                onClick={() => onNavigate('Rewards')}
              >
                View & Claim Dividends →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            disabled={safePage === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >‹ Previous</button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              className={`page-btn num ${safePage === p ? 'active' : ''}`}
              onClick={() => setPage(p)}
            >{p}</button>
          ))}
          {totalPages > 5 && <span className="page-ellipsis">...</span>}
          <button
            className="page-btn"
            disabled={safePage === totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >Next ›</button>
        </div>
      )}
    </div>
  );
}
