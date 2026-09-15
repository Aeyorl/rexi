import { useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import './WalletModal.css';

const ROBINHOOD_FEATHER_SVG = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M19.4 3C19.4 3 14.8 4.2 11.2 7.8C7.6 11.4 6 16.5 6 16.5L9.5 15.5L8 18.5L12 17.5L10.5 20.5C10.5 20.5 15.5 19 19 15.5C22.5 12 23.5 7.5 23.5 7.5L20 8.5L21.5 5.5L17.5 6.5L19.4 3Z"
      fill="#00c805"
    />
    <path
      d="M5.5 18C4 19.5 2 22 2 22C2 22 4.5 20 6 18.5L5.5 18Z"
      fill="#00c805"
    />
  </svg>
);

const OPTIONS = [
  {
    id: 'robinhood_wallet',
    name: 'Robinhood Wallet',
    badge: 'Recommended',
    tag: 'Web3 Self-Custody',
    desc: 'Trade tokenized stocks with self-custody & zero protocol markup',
    icon: (
      <div className="rh-icon-wrap primary">
        {ROBINHOOD_FEATHER_SVG}
      </div>
    )
  },
  {
    id: 'robinhood_connect',
    name: 'Robinhood Connect',
    badge: 'Direct Brokerage',
    tag: 'Instant Cash Deposit',
    desc: 'Fund directly from your Robinhood brokerage checking / cash balance',
    icon: (
      <div className="rh-icon-wrap secondary">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00c805" strokeWidth="2">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      </div>
    )
  },
  {
    id: 'demo',
    name: '1-Click Robinhood Demo',
    badge: 'Instant $10k',
    tag: 'Simulated Brokerage',
    desc: 'Pre-loaded with $10,000 buying power and AAPLx, TSLAx, SpaceX holdings',
    icon: (
      <div className="rh-icon-wrap demo">
        ⚡
      </div>
    )
  }
];

export default function WalletModal() {
  const { isModalOpen, closeModal, connect, connecting } = useWallet();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isModalOpen) closeModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, closeModal]);

  if (!isModalOpen) return null;

  return (
    <div className="wallet-modal-overlay" onClick={closeModal}>
      <div className="wallet-modal-card animate-in" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="wallet-modal-header">
          <div className="wallet-modal-title">
            <div className="title-rh-badge">
              {ROBINHOOD_FEATHER_SVG}
            </div>
            <div>
              <div className="title-text">Connect Robinhood</div>
              <div className="title-sub">Trade Tokenized Stocks & Earn Dividends</div>
            </div>
          </div>
          <button className="wallet-modal-close" onClick={closeModal} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="2">
              <line x1="1" y1="1" x2="13" y2="13"/>
              <line x1="1" y1="13" x2="13" y2="1"/>
            </svg>
          </button>
        </div>

        <div className="rh-modal-banner">
          <span className="rh-banner-dot" />
          <span>Commission-free trading on tokenized stocks, pre-IPO shares, and yield.</span>
        </div>

        {/* Options */}
        <div className="wallet-options-list">
          {OPTIONS.map((opt) => (
            <button
              key={opt.id}
              className="wallet-option-item rh-option"
              disabled={connecting}
              onClick={() => connect(opt.id)}
            >
              <div className="wallet-option-icon">{opt.icon}</div>
              <div className="wallet-option-info">
                <div className="wallet-option-name-row">
                  <span className="wallet-name-text">{opt.name}</span>
                  {opt.badge && (
                    <span className={`wallet-badge ${opt.id === 'robinhood_wallet' ? 'popular' : opt.id === 'demo' ? 'instant' : 'detected'}`}>
                      {opt.badge}
                    </span>
                  )}
                </div>
                <span className="wallet-desc-text">{opt.desc}</span>
              </div>
              <div className="wallet-chevron">
                {connecting ? (
                  <span className="wallet-spinner rh-spinner" />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 12l4-4-4-4"/>
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="wallet-modal-footer rh-footer">
          <div className="rh-security-note">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00c805" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>Secured with Robinhood Connect API</span>
          </div>
          <a
            href="https://robinhood.com/wallet"
            target="_blank"
            rel="noreferrer"
            className="footer-link"
          >
            Learn about Robinhood Wallet
          </a>
        </div>
      </div>
    </div>
  );
}
