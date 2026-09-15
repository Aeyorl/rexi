import { useState, useRef, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import './Navbar.css';

const NAV_ITEMS = ['Explore', 'Launch token', 'SPL-404', 'Rewards', 'Revenue', 'Dividends', 'Desks', 'Analytics'];

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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [showDepositInput, setShowDepositInput] = useState(false);
  const dropdownRef = useRef(null);

  const {
    connected,
    connecting,
    walletName,
    accountNumber,
    buyingPower,
    totalAccountValue,
    holdings,
    openModal,
    disconnect,
    openTradeModal,
    depositFunds
  } = useWallet();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeposit = () => {
    const amt = parseFloat(depositAmount);
    if (amt && amt > 0) {
      depositFunds(amt);
      setDepositAmount('');
      setShowDepositInput(false);
    }
  };

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

        {/* Right side Robinhood Connect */}
        <div className="navbar-right">
          {!connected ? (
            <button
              className="btn-connect rh-connect-btn"
              disabled={connecting}
              onClick={openModal}
            >
              <span className="rh-btn-icon">{RH_FEATHER_MINI}</span>
              <span>{connecting ? 'Connecting...' : 'Connect Robinhood'}</span>
            </button>
          ) : (
            <div className="wallet-connected-wrapper" ref={dropdownRef}>
              <button
                className={`wallet-pill rh-pill ${dropdownOpen ? 'active' : ''}`}
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <span className="rh-feather-badge">{RH_FEATHER_MINI}</span>
                <span className="rh-buying-power">
                  ${buyingPower.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} Buying Power
                </span>
                <span className="wallet-pill-addr">{accountNumber}</span>
                <svg
                  className={`pill-chevron ${dropdownOpen ? 'open' : ''}`}
                  width="12"
                  height="12"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 6l4 4 4-4" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="wallet-dropdown rh-dropdown animate-in">
                  <div className="dropdown-header">
                    <div className="dropdown-wallet-meta">
                      <span className="rh-mini-dot" />
                      <span className="dropdown-wallet-name">{walletName}</span>
                      <span className="dropdown-net-tag rh-tag">Brokerage</span>
                    </div>
                    <span className="dropdown-acct-num">{accountNumber}</span>
                  </div>

                  {/* Account Values */}
                  <div className="rh-dropdown-balances">
                    <div className="rh-dropdown-bal-col">
                      <span className="rh-bal-lbl">Portfolio Value</span>
                      <span className="rh-bal-num">
                        ${totalAccountValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="rh-dropdown-bal-col right">
                      <span className="rh-bal-lbl">Buying Power</span>
                      <span className="rh-bal-num green">
                        ${buyingPower.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Holdings List */}
                  <div className="rh-holdings-preview">
                    <div className="rh-holdings-header">
                      <span>YOUR STOCKS & PRE-IPO</span>
                      <span>SHARES</span>
                    </div>
                    <div className="rh-holdings-rows">
                      {holdings.map(h => (
                        <div key={h.symbol} className="rh-holding-item" onClick={() => {
                          openTradeModal(h);
                          setDropdownOpen(false);
                        }}>
                          <div className="h-left">
                            <span className="h-symbol">{h.symbol}</span>
                            <span className="h-name">{h.name}</span>
                          </div>
                          <div className="h-right">
                            <span className="h-shares">{h.shares}</span>
                            <span className="h-val">${h.total.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="rh-dropdown-actions">
                    {!showDepositInput ? (
                      <button
                        className="btn-rh-deposit"
                        onClick={() => setShowDepositInput(true)}
                      >
                        + Deposit Cash via Robinhood Connect
                      </button>
                    ) : (
                      <div className="rh-deposit-input-row">
                        <input
                          type="number"
                          placeholder="$ Amount"
                          className="deposit-num-input"
                          value={depositAmount}
                          onChange={e => setDepositAmount(e.target.value)}
                        />
                        <button className="btn-confirm-dep" onClick={handleDeposit}>
                          Add
                        </button>
                        <button className="btn-cancel-dep" onClick={() => setShowDepositInput(false)}>
                          ✕
                        </button>
                      </div>
                    )}

                    <div className="rh-action-links">
                      <button
                        className="btn-quick-trade"
                        onClick={() => {
                          openTradeModal(holdings[0]);
                          setDropdownOpen(false);
                        }}
                      >
                        Trade Stocks
                      </button>
                      <button
                        className="dropdown-disconnect-btn"
                        onClick={() => {
                          disconnect();
                          setDropdownOpen(false);
                        }}
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
