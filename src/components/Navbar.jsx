// Rexi navbar: page links plus the real wallet state. The old
// buying-power/holdings/deposit dropdown was simulated brokerage data,
// so it is gone — the pill shows the connected address and links out to
// the chain explorer.
import { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { REXI_NETWORK, explorerAddressUrl } from '../services/deployments';
import './Navbar.css';

const NAV_ITEMS = ['Explore', 'Launch token', 'Rewards', 'Revenue', 'Desks', 'Analytics'];

const RH_FEATHER_MINI = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
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

export default function Navbar({ activePage, onNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const {
    connected,
    connecting,
    walletAddress,
    shortAddress,
    disconnect,
    connect
  } = useWallet();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <button className="navbar-logo" onClick={() => onNavigate('Explore')}>
          <div className="logo-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="1" y="1" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <rect x="3" y="3" width="14" height="10" rx="1" fill="currentColor" opacity="0.2"/>
              <rect x="3" y="3" width="14" height="10" rx="1" stroke="currentColor" strokeWidth="1" fill="none"/>
              <rect x="5" y="5" width="10" height="6" fill="currentColor" opacity="0.5"/>
              <rect x="6" y="14" width="8" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="4" y="16.5" width="12" height="1" rx="0.5" fill="currentColor" opacity="0.5"/>
            </svg>
          </div>
        </button>

        {/* Links */}
        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          {NAV_ITEMS.map(item => (
            <button
              key={item}
              className={`nav-link ${activePage === item ? 'active' : ''}`}
              onClick={() => { onNavigate(item); setMenuOpen(false); }}
            >
              {item === 'Analytics' ? 'Analy' : item}
            </button>
          ))}
        </div>

        {/* Right side: real wallet */}
        <div className="navbar-right">
          {!connected ? (
            <button
              className="btn-connect rh-connect-btn"
              disabled={connecting}
              onClick={connect}
            >
              <span className="rh-btn-icon">{RH_FEATHER_MINI}</span>
              <span>{connecting ? 'Connecting...' : 'Connect Wallet'}</span>
            </button>
          ) : (
            <div className="wallet-connected-wrapper">
              <a
                className="wallet-pill rh-pill"
                href={explorerAddressUrl(walletAddress)}
                target="_blank"
                rel="noreferrer"
                title={`${walletAddress} · ${REXI_NETWORK.chainName}`}
              >
                <span className="rh-feather-badge">{RH_FEATHER_MINI}</span>
                <span className="wallet-pill-addr">{shortAddress || walletAddress}</span>
              </a>
              <button className="dropdown-disconnect-btn" onClick={disconnect}>
                Disconnect
              </button>
            </div>
          )}

          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            <span/><span/><span/>
          </button>
        </div>
      </div>
    </nav>
  );
}