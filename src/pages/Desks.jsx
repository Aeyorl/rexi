import { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { DESKS } from '../data/mockData';
import './Desks.css';

const DESK_TABS = ['All', 'Yours', 'Burns'];

export default function Desks() {
  const { connected, openModal } = useWallet();
  const [activeTab, setActiveTab] = useState('All');
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const yourDesks = [
    { id: 418, name: 'OTC Desk #418', earned: '1,420.50' },
    { id: 1042, name: 'OTC Desk #1042', earned: '840.12' }
  ];

  const currentList = activeTab === 'Yours' 
    ? (connected ? yourDesks : [])
    : DESKS;

  const totalPages = Math.max(1, Math.ceil(currentList.length / PER_PAGE));
  const paged = currentList.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="desks-page">
      {/* Status bar */}
      <div className="desks-status-bar">
        <div className="status-item">
          <span className="status-dot live"></span>
          <div>
            <div className="status-label">MINTED</div>
            <div className="status-val accent">2,245 / 5000</div>
          </div>
        </div>
        <div className="status-item">
          <div className="status-label">LIVE DESKS</div>
          <div className="status-val">2,245</div>
        </div>
        <div className="status-item">
          <div className="status-label">OTC BURNED</div>
          <div className="status-val accent">248,800,000</div>
        </div>
        <div className="status-item">
          <div className="status-label">BUYS NEXT</div>
          <div className="status-val">
            <span className="neuralink-dot">🧠</span> NEURALINK
          </div>
        </div>
        <div className="status-item">
          <div className="status-label">PAID TO HOLDERS</div>
          <div className="status-val green">$466,989.38</div>
        </div>
      </div>

      {/* Desks List */}
      <div className="desks-card">
        {/* Tabs */}
        <div className="desks-tabs">
          {DESK_TABS.map(tab => (
            <button
              key={tab}
              className={`desks-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab} {tab === 'All' ? '2245' : tab === 'Burns' ? '2245' : ''}
            </button>
          ))}
          <button className="desks-history-btn">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M6.5 3.5V6.5l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            History
          </button>
        </div>

        {/* List */}
        {activeTab === 'Yours' && !connected ? (
          <div className="desks-connect-prompt">
            <div className="prompt-inner">
              <span className="prompt-icon">🔐</span>
              <h3>Connect your wallet</h3>
              <p>Connect Robinhood to view your Rexi desks and claim revenue rewards.</p>
              <button className="btn-connect-desks" onClick={openModal}>Connect Wallet</button>
            </div>
          </div>
        ) : paged.map((desk, i) => (
          <div key={desk.id} className="desk-row animate-in">
            <div className="desk-num">{(page - 1) * PER_PAGE + i + 1}</div>
            <div className="desk-nft">
              <div className="desk-nft-img">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <rect x="2" y="2" width="24" height="24" rx="4" fill="var(--bg-secondary)" stroke="var(--border)" strokeWidth="1"/>
                  <rect x="4" y="4" width="20" height="14" rx="2" fill="var(--bg-elevated)"/>
                  <rect x="6" y="6" width="16" height="10" fill="var(--accent-dim)"/>
                  <rect x="10" y="19" width="8" height="2" rx="1" fill="var(--border)"/>
                  <rect x="7" y="22" width="14" height="1.5" rx="0.75" fill="var(--border-subtle)"/>
                </svg>
              </div>
            </div>
            <div className="desk-info">
              <div className="desk-name">{desk.name}</div>
              <div className="desk-dots">
                {Array.from({ length: 20 }, (_, j) => (
                  <span key={j} className={`desk-dot ${j < Math.floor(desk.id / 100) ? 'filled' : ''}`} />
                ))}
              </div>
            </div>
            <div className="desk-earned">
              <div className="desk-earned-val">${desk.earned}</div>
              <div className="desk-earned-label">EARNED</div>
            </div>
          </div>
        ))}

        {/* Pagination */}
        <div className="desks-pagination">
          <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹ Previous</button>
          {[1, 2, 3].map(p => (
            <button key={p} className={`page-btn num ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          <span className="page-ellipsis">...</span>
          <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next ›</button>
        </div>
      </div>
    </div>
  );
}
