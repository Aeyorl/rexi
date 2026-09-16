// Rexi connect modal: one real option — an injected EVM wallet that the app
// switches to Robinhood Chain Testnet. No brokerage, deposit or demo paths:
// everything in the app runs against real contracts and the chain index.
import { useEffect, useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { REXI_NETWORK } from '../services/deployments';
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

export default function WalletModal() {
  const { isModalOpen, closeModal, connect, connecting } = useWallet();
  const [connectError, setConnectError] = useState('');
  // window is always defined in the browser bundle; no SSR in this app.
  const [hasProvider] = useState(() => typeof window !== 'undefined' && Boolean(window.ethereum));

  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, closeModal]);

  const handleConnect = async () => {
    setConnectError('');
    try {
      await connect();
    } catch (err) {
      setConnectError(err.message || 'Wallet connection failed.');
    }
  };

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
              <div className="title-text">Connect wallet</div>
              <div className="title-sub">Robinhood Chain Testnet · chain {REXI_NETWORK.chainIdDecimal}</div>
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
          <span>Connect a self-custody wallet on {REXI_NETWORK.chainName}. Approvals and claims are real transactions.</span>
        </div>

        {/* Options */}
        <div className="wallet-options-list">
          <button
            className="wallet-option-item rh-option"
            disabled={connecting || !hasProvider}
            onClick={handleConnect}
          >
            <div className="wallet-option-icon">
              <div className="rh-icon-wrap primary">
                {ROBINHOOD_FEATHER_SVG}
              </div>
            </div>
            <div className="wallet-option-info">
              <div className="wallet-option-name-row">
                <span className="wallet-name-text">Browser wallet</span>
                <span className="wallet-badge popular">EVM injected</span>
              </div>
              <span className="wallet-desc-text">
                MetaMask, Rabby or Robinhood Wallet — switched to {REXI_NETWORK.chainName} on connect
              </span>
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

          {!hasProvider && (
            <div className="wallet-no-provider">
              <span>No injected wallet detected.</span>
              <a
                href="https://robinhood.com/wallet"
                target="_blank"
                rel="noreferrer"
                className="footer-link"
              >
                Get Robinhood Wallet
              </a>
            </div>
          )}
        </div>

        {connectError && (
          <div className="wallet-connect-error">{connectError}</div>
        )}

        {/* Footer */}
        <div className="wallet-modal-footer rh-footer">
          <div className="rh-security-note">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00c805" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>Testnet only — never share a private key</span>
          </div>
          <a
            href={REXI_NETWORK.blockExplorerUrl}
            target="_blank"
            rel="noreferrer"
            className="footer-link"
          >
            Open the chain explorer
          </a>
        </div>
      </div>
    </div>
  );
}