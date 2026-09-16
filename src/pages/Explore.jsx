import { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import Sparkline from '../components/Sparkline';
import { TOKENS } from '../data/mockData';
import { fetchChainIndex, fetchTokens } from '../services/api';
import './Explore.css';

const FILTERS = ['FDV', 'Recent', '24h volume'];

// Mini chart for the hero $OTC price line
function MiniOTCChart() {
  const pts = [62,58,61,55,52,57,60,56,53,58,61,57,54,60,63,59,55,57,61,58,56,60,57,53,55,58,56,54,57,55];
  const w = 140, h = 36;
  const min = Math.min(...pts), max = Math.max(...pts);
  const range = max - min || 1;
  const points = pts.map((v, i) => `${(i/(pts.length-1))*w},${h - ((v-min)/range)*h*0.85 - h*0.075}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <polyline points={points} fill="none" stroke="#4ec994" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export default function Explore({ onNavigate }) {
  const { openTradeModal } = useWallet();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('FDV');
  const [page, setPage] = useState(1);
  const [tokenList, setTokenList] = useState(TOKENS);
  const [chainIndex, setChainIndex] = useState(null);
  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    let active = true;
    async function load() {
      const data = await fetchTokens({ search, sort: activeFilter });
      if (active && data && data.length > 0) {
        setTokenList(data);
      }
    }
    load();
    return () => { active = false; };
  }, [search, activeFilter]);

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

  const filtered = tokenList.filter(t =>
    t.symbol.toLowerCase().includes(search.toLowerCase()) ||
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

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
            <button
              className="btn-rh-hero"
              onClick={() => openTradeModal({ symbol: 'AAPLx', name: 'Apple Inc. Tokenized', price: 228.40 })}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M19.4 3C19.4 3 14.8 4.2 11.2 7.8C7.6 11.4 6 16.5 6 16.5L9.5 15.5L8 18.5L12 17.5L10.5 20.5C10.5 20.5 15.5 19 19 15.5C22.5 12 23.5 7.5 23.5 7.5L20 8.5L21.5 5.5L17.5 6.5L19.4 3Z" fill="#00c805"/>
                <path d="M5.5 18C4 19.5 2 22 2 22C2 22 4.5 20 6 18.5L5.5 18Z" fill="#00c805"/>
              </svg>
              Trade Stocks via Robinhood
            </button>
            <button className="btn-ghost">How it works →</button>
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
            <span className="ticker-label">$OTC</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ opacity: 0.5 }}>
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M7 4v3l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="hero-price">$3.69M</div>
          <div className="hero-change positive">+13.9% <span>24h</span></div>
          <div className="hero-chart">
            <MiniOTCChart />
          </div>
        </div>
      </div>

      {/* Live Robinhood Chain launches (real, indexed from the launchpad) */}
      <div className="chain-launches">
        <div className="section-header">
          <h2>Live on Robinhood Chain Testnet</h2>
          <span className="section-sub">
            {chainIndex?.launchpad
              ? `launchpad ${chainIndex.launchpad.slice(0, 6)}…${chainIndex.launchpad.slice(-4)}`
              : 'indexing…'}
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
        {chainStats && <span className="sort-label">{chainStats.launchCount} live Robinhood launches</span>}
        <div className="search-wrap">
          <svg className="search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            className="search-input"
            placeholder="Search"
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
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
          <button className="filter-btn spl">⬛ SPL-404</button>
          <button className="filter-btn">Filter ▾</button>
        </div>
      </div>

      {/* Token Grid */}
      <div className="token-grid">
        {paged.map(token => (
          <div key={token.id} className="token-card animate-in">
            <div className="token-card-header">
              <div className="token-avatar">
                <span className="token-avatar-text">{token.symbol.slice(1, 3).toUpperCase()}</span>
              </div>
              <div className="token-meta">
                <div className="token-symbol-row">
                  <span className="token-symbol">{token.symbol}</span>
                  <span className="token-badge">{token.badge}</span>
                  {token.extraBadge && <span className="token-badge extra">{token.extraBadge}</span>}
                </div>
                <span className="token-name">{token.name}</span>
              </div>
              <button className="token-copy" title="Copy address">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                  <path d="M1 8V1h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="token-fdv">{token.fdv}</div>
            <div className="token-pays">
              <span className="pays-label">Pays</span>
              <span className="pays-icon">{token.paysIcon}</span>
              <span className="pays-name">{token.pays}</span>
              <button
                className="btn-card-rh-trade"
                title={`Trade ${token.pays} on Robinhood`}
                onClick={(e) => {
                  e.stopPropagation();
                  openTradeModal({
                    symbol: token.pays || 'AAPLx',
                    name: `${token.pays} Stock Dividend Token`,
                    price: token.pays === 'TSLAx' ? 214.20 : token.pays === 'NVDAx' ? 128.50 : 228.40
                  });
                }}
              >
                Trade {token.pays}
              </button>
            </div>
            <div className="token-sparkline">
              <Sparkline trend={token.trend} width={280} height={44} />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >‹ Previous</button>
          {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              className={`page-btn num ${page === p ? 'active' : ''}`}
              onClick={() => setPage(p)}
            >{p}</button>
          ))}
          {totalPages > 3 && <span className="page-ellipsis">...</span>}
          <button
            className="page-btn"
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
          >Next ›</button>
        </div>
      )}
    </div>
  );
}
