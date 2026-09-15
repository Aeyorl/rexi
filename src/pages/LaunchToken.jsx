import { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { STOCK_ASSETS } from '../data/mockData';
import { launchToken } from '../services/api';
import { createRexiLaunch } from '../services/rexiChain';
import { REXI_TEST_STOCK_TOKEN_TESTNET } from '../services/robinhoodChain';
import './LaunchToken.css';

const CASH_OPTIONS = ['None', '$50', '$100', '$250', '$500'];
const TABS = ['All stocks', 'Public stocks', 'Pre-IPO'];

export default function LaunchToken() {
  const { connected, openModal } = useWallet();
  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [description, setDescription] = useState('');
  const [xLink, setXLink] = useState('');
  const [cashOption, setCashOption] = useState('None');
  const [selectedPair, setSelectedPair] = useState('AAPLx');
  const [holderMode, setHolderMode] = useState('pair');
  const [assetTab, setAssetTab] = useState('All 150');
  const [assetSearch, setAssetSearch] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [launchStatus, setLaunchStatus] = useState(null); // 'signing' | 'deploying' | 'success'
  const [launchError, setLaunchError] = useState('');

  const handleLaunch = async () => {
    if (!name || !ticker) {
      setLaunchError('Please provide a token name and symbol/ticker.');
      return;
    }
    setLaunchError('');
    setLaunchStatus('signing');

    try {
      await new Promise(r => setTimeout(r, 600));
      setLaunchStatus('deploying');
      const chainLaunch = await createRexiLaunch({ name, symbol: ticker, rewardAsset: REXI_TEST_STOCK_TOKEN_TESTNET, supply: 1000000 });
      await launchToken({ name, symbol: ticker, description, pair: selectedPair, firstBuyUsd: cashOption === 'None' ? 0 : Number(cashOption.replace('$', '')), txHash: chainLaunch.hash });
      setLaunchStatus('success');
    } catch (err) {
      setLaunchStatus(null);
      setLaunchError(err.message || 'Launch failed. Check the Rexi service and try again.');
    }
  };

  const filteredAssets = STOCK_ASSETS.filter(a =>
    a.symbol.toLowerCase().includes(assetSearch.toLowerCase()) ||
    a.name.toLowerCase().includes(assetSearch.toLowerCase())
  );

  const feeBreakdown = [
    { label: 'Holders, in selected stock', value: '67.5%' },
    { label: 'Desks', value: '10%' },
    { label: 'Protocol', value: '5%' },
    { label: 'Rexi buybacks', value: '10%' },
    { label: 'Rexi holders, in cash', value: '5%' },
    { label: 'Platform operations', value: '2.5%' },
  ];

  return (
    <div className="launch-token">
      <h1 className="page-title">Launch a coin</h1>

      {/* Launch On */}
      <div className="form-section">
        <label className="section-label">LAUNCH ON</label>
        <div className="platform-row"><div className="platform-btn active"><span className="platform-icon">🟢</span> Rexi · Robinhood</div></div>
      </div>

      {/* Token Details */}
      <div className="form-section details-grid">
        <div className="image-upload" onClick={() => document.getElementById('img-input').click()}>
          {imageFile ? (
            <img src={URL.createObjectURL(imageFile)} alt="token" className="uploaded-img" />
          ) : (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M3 16l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
              </svg>
              <span>ADD IMAGE</span>
            </>
          )}
          <input id="img-input" type="file" accept="image/*" hidden onChange={e => setImageFile(e.target.files[0])} />
        </div>

        <div className="token-fields">
          <div className="fields-row">
            <div className="field-wrap">
              <div className="field-header">
                <label>NAME</label>
                <span className="char-count">{name.length}/32</span>
              </div>
              <input
                className="form-input"
                placeholder="Token name"
                value={name}
                maxLength={32}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="field-wrap ticker-field">
              <div className="field-header">
                <label>TICKER</label>
                <span className="char-count">{ticker.length}/13</span>
              </div>
              <input
                className="form-input"
                placeholder="SYMBOL"
                value={ticker}
                maxLength={13}
                onChange={e => setTicker(e.target.value.toUpperCase())}
              />
            </div>
          </div>
          <div className="field-wrap">
            <div className="field-header">
              <label>DESCRIPTION</label>
              <span className="char-count">{description.length}/500</span>
            </div>
            <textarea
              className="form-input form-textarea"
              placeholder="What the coin is, in a line or two."
              value={description}
              maxLength={500}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* X Link */}
      <div className="form-section">
        <div className="field-header">
          <label>X</label>
          <span className="char-count">{xLink.length}/120</span>
        </div>
        <input
          className="form-input"
          placeholder="x.com/you, or a link to the tweet"
          value={xLink}
          maxLength={120}
          onChange={e => setXLink(e.target.value)}
        />
      </div>

      {/* First Buy */}
      <div className="form-section">
        <label className="section-label">YOUR FIRST BUY</label>
        <p className="section-desc">
          Your first buy is funded in USD through Robinhood and allocated to the selected stock reward.
        </p>
        <div className="sol-options">
          {CASH_OPTIONS.map(opt => (
            <button
              key={opt}
              className={`sol-btn ${cashOption === opt ? 'active' : ''}`}
              onClick={() => setCashOption(opt)}
            >
              {opt}
            </button>
          ))}
          <div className="sol-display">{cashOption}</div>
        </div>
      </div>

      {/* Paired With */}
      <div className="form-section">
        <label className="section-label">PAIRED WITH</label>
        <div className="asset-tabs">
          {TABS.map(tab => (
            <button
              key={tab}
              className={`asset-tab ${assetTab === tab ? 'active' : ''}`}
              onClick={() => setAssetTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="asset-search-wrap">
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ color: 'var(--text-muted)' }}>
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            className="asset-search"
            placeholder="Search by ticker, name or address"
            value={assetSearch}
            onChange={e => setAssetSearch(e.target.value)}
          />
        </div>
        <div className="asset-grid">
          {filteredAssets.map(asset => (
            <button
              key={asset.symbol}
              className={`asset-item ${selectedPair === asset.symbol ? 'active' : ''}`}
              onClick={() => setSelectedPair(asset.symbol)}
            >
              <div className="asset-icon">{asset.symbol.slice(0, 2).toUpperCase()}</div>
              <div className="asset-info">
                <span className="asset-symbol">{asset.symbol}</span>
                <span className="asset-name">{asset.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Holders Are Paid */}
      <div className="form-section">
        <label className="section-label">HOLDERS ARE PAID</label>
        <div className="holder-options">
          <button
            className={`holder-btn ${holderMode === 'pair' ? 'active' : ''}`}
            onClick={() => setHolderMode('pair')}
          >
            <span className="holder-title">The pair</span>
            <span className="holder-desc">What it earns, sent straight out</span>
          </button>
          <button
            className={`holder-btn ${holderMode === 'basket' ? 'active' : ''}`}
            onClick={() => setHolderMode('basket')}
          >
            <span className="holder-title">A basket</span>
            <span className="holder-desc">Up to 5, one each round</span>
          </button>
        </div>
        <p className="section-desc">
          Holders are paid AAPLx itself. Nothing is traded, so there is no route to find and no slippage.
        </p>
      </div>

      {/* Launch Summary */}
      <div className="launch-summary">
        <h2 className="summary-title">Launch summary</h2>
        <div className="summary-token">
          <div className="summary-img-placeholder">
            {imageFile ? (
              <img src={URL.createObjectURL(imageFile)} alt="" className="summary-img" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            )}
          </div>
          <div>
            <div className="summary-token-name">{name || 'Untitled'}</div>
            <div className="summary-token-ticker">{ticker ? `$${ticker}` : 'No ticker yet'}</div>
          </div>
        </div>

        <div className="summary-rows">
          <div className="summary-row">
            <span>Launching on</span>
            <span>Rexi · Robinhood</span>
          </div>
          <div className="summary-row">
            <span>Paired with</span>
            <span className="pair-val">
              <span className="pair-dot">⬛</span> {selectedPair}
            </span>
          </div>
          <div className="summary-row">
            <span>Trading fee</span>
            <span>1%</span>
          </div>
          <div className="summary-row">
            <span>Your first buy</span>
            <span>{cashOption}</span>
          </div>
        </div>

        <div className="fee-breakdown">
          <div className="fee-breakdown-label">OF EVERY FEE</div>
          {feeBreakdown.map(item => (
            <div key={item.label} className="summary-row">
              <span>{item.label}</span>
              <span className="fee-val">{item.value}</span>
            </div>
          ))}
        </div>

        <p className="rent-note">
          A holder needs a token account before {selectedPair} can reach them. This opens one, once, and it is theirs — worth about $0.58, refundable to them if they ever close it.
        </p>

        {launchError && (
          <div className="launch-error-msg">{launchError}</div>
        )}

        {!connected ? (
          <button
            type="button"
            className="btn-launch connect-prompt"
            onClick={openModal}
          >
            Connect Wallet to Launch
          </button>
        ) : launchStatus === 'success' ? (
          <div className="launch-success-banner">
            <span className="success-icon">🎉</span>
            <div className="success-text">
              <strong>${ticker} Launched Successfully!</strong>
              <span>Bonding curve active. Holders now earn {selectedPair} dividends.</span>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="btn-launch"
            disabled={!!launchStatus}
            onClick={handleLaunch}
          >
            {launchStatus === 'signing'
              ? 'Requesting Wallet Signature...'
              : launchStatus === 'deploying'
              ? 'Deploying Bonding Curve...'
              : 'Launch Token'}
          </button>
        )}
      </div>
    </div>
  );
}
