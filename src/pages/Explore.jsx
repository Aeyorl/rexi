import { useState, useEffect } from 'react';
import { fetchChainIndex } from '../services/api';
import './Explore.css';

// Real, on-chain-backed sorts the launchpad data actually supports.
const FILTERS = ['Recent', 'Distributed', 'Claims'];


export default function Explore({ onNavigate }) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('Recent');
  const [page, setPage] = useState(1);
  const [chainIndex, setChainIndex] = useState(null);
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
    if (activeFilter === 'Distributed') return Number(b.distributedRaw) - Number(a.distributedRaw);
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
        <div className="hero-left">
          <h1 className="hero-title">Launch tokens that reward stocks.</h1>
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
              <span className="hero-stat-label">Launches on testnet</span>
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
        <div className="hero-right">
          <div className="hero-price-ticker">
            <span className="ticker-label">On testnet</span>
          </div>
          <div className="hero-price">{chainStats ? `${chainStats.launchCount} launches` : '—'}</div>
          <div className="hero-change positive">
            {chainStats ? `${chainStats.legacyLaunchCount} legacy` : 'Reading chain…'}
          </div>
          <div className="hero-chart">
            <div className="hero-chain-note">
              {chainIndex?.launchpad ? `${chainIndex.launchpad.slice(0, 8)}…${chainIndex.launchpad.slice(-6)}` : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Live on the chain index: launches from every indexed deployment */}
      <div className="chain-launches">
        <div className="section-header">
          <h2>Live on Robinhood Chain Testnet</h2>
          <span className="section-sub">
            {chainIndex?.launchpad
              ? `launchpad ${chainIndex.launchpad.slice(0, 6)}…${chainIndex.launchpad.slice(-4)}`
              : 'indexing…'}
            {chainStats?.legacyLaunchCount > 0 ? ` · +${chainStats.legacyLaunchCount} legacy` : ''}
          </span>
        </div>
        {chainLaunches.length === 0 ? (
          <div className="chain-empty">
            {chainIndex ? 'No launches indexed yet — launch the first one.' : 'Reading the launchpad…'}
          </div>
        ) : (
          <div className="chain-grid">
            {chainLaunches.map(launch => (
              <a
                key={launch.token}
                className="chain-card"
                href={launch.tokenUrl}
                target="_blank"
                rel="noreferrer"
              >
                <div className="chain-card-top">
                  <span className="chain-avatar">{(launch.symbol || '??').slice(0, 2).toUpperCase()}</span>
                  <div className="chain-meta">
                    <span className="chain-symbol">${launch.symbol || 'unknown'}</span>
                    <span className="chain-name">{launch.name || 'Unnamed launch'}</span>
                  </div>
                  <span className={`chain-status ${launch.active ? 'live' : 'closed'}`}>
                    {launch.active ? 'live' : 'closed'}
                  </span>
                  {launch.legacy && <span className="chain-status legacy">legacy</span>}
                </div>
                <div className="chain-rows">
                  <div className="chain-row">
                    <span>Supply</span>
                    <span>{launch.supplyFormatted ?? '—'} ${launch.symbol || ''}</span>
                  </div>
                  <div className="chain-row">
                    <span>Pays holders</span>
                    <span>{launch.rewardAssetSymbol || 'reward asset'}</span>
                  </div>
                  <div className="chain-row">
                    <span>Distributed</span>
                    <span>{launch.distributed} {launch.rewardAssetSymbol}</span>
                  </div>
                  <div className="chain-row">
                    <span>Claims</span>
                    <span>{launch.claimCount} · {launch.claimed} {launch.rewardAssetSymbol}</span>
                  </div>
                </div>
                <span className="chain-address">{launch.token.slice(0, 10)}…{launch.token.slice(-6)}</span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Token List Controls */}
      <div className="token-controls">
        <span className="sort-label">
          {chainStats ? `${filteredChain.length} live Robinhood launch${filteredChain.length === 1 ? '' : 'es'}` : 'Reading Robinhood Chain…'}
        </span>
        <div className="search-wrap">
          <svg className="search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            className="search-input"
            placeholder="Search by symbol, name or address"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <span className="sort-label">Sort</span>
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

      {/* Real launches as the browse grid, searchable and sortable */}
      <div className="token-grid">
        {filteredChain.length === 0 && (
          <div className="chain-empty">
            {chainIndex ? 'No launches match. Launch the first one.' : 'Reading the launchpad…'}
          </div>
        )}
        {pagedChain.map(launch => (
          <a key={launch.token} className="token-card animate-in" href={launch.tokenUrl} target="_blank" rel="noreferrer">
            <div className="token-card-header">
              <div className="token-avatar">
                <span className="token-avatar-text">{(launch.symbol || '??').slice(0, 2).toUpperCase()}</span>
              </div>
              <div className="token-meta">
                <div className="token-symbol-row">
                  <span className="token-symbol">${launch.symbol || 'unknown'}</span>
                  <span className="token-badge">{launch.active ? 'live' : 'closed'}</span>
                  {launch.legacy && <span className="token-badge extra">legacy</span>}
                </div>
                <span className="token-name">{launch.name || 'Unnamed launch'}</span>
              </div>
            </div>
            <div className="token-fdv">{launch.supplyFormatted ?? '—'} ${launch.symbol || ''} supply</div>
            <div className="token-pays">
              <span className="pays-label">Pays</span>
              <span className="pays-name">{launch.rewardAssetSymbol || 'reward asset'}</span>
              <span className="pays-meta">
                {(launch.distributed || '0')} distributed · {(launch.claimed || '0')} claimed
              </span>
            </div>
          </a>
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
          {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              className={`page-btn num ${safePage === p ? 'active' : ''}`}
              onClick={() => setPage(p)}
            >{p}</button>
          ))}
          {totalPages > 3 && <span className="page-ellipsis">...</span>}
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
