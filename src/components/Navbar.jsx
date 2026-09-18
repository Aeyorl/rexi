// Rexi navbar: page links plus the real wallet state. The old
// buying-power/holdings/deposit dropdown was simulated brokerage data,
// so it is gone — the pill shows the connected address and links out to
// the chain explorer.
import { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { ACTIVE_NETWORK, explorerAddressUrl } from '../services/deployments';
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
          <img className="bool-logo" src="/brand/bool-logo.svg" alt="Bool" width="126" height="40" />
        </button>

        {/* Links */}
        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          {NAV_ITEMS.map(item => (
            <button
              key={item}
              className={`nav-link ${activePage === item ? 'active' : ''}`}
              onClick={() => { onNavigate(item); setMenuOpen(false); }}
            >
              {item}
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
                title={`${walletAddress} · ${ACTIVE_NETWORK.chainName}`}
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