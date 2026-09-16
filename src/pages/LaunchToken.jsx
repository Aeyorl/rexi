import { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { createRexiLaunch } from '../services/rexiChain';
import {
  REXI_REWARD_ASSET,
  REXI_REWARD_ASSETS,
  REXI_FEE_SPLIT,
  REXI_LAUNCHPAD,
  explorerAddressUrl
} from '../services/deployments';
import './LaunchToken.css';

const DEFAULT_SUPPLY = '1000000';

export default function LaunchToken() {
  const { connected, openModal } = useWallet();
  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [description, setDescription] = useState('');
  const [xLink, setXLink] = useState('');
  const [supply, setSupply] = useState(DEFAULT_SUPPLY);
  const [rewardAsset, setRewardAsset] = useState(REXI_REWARD_ASSET);
  const [imageFile, setImageFile] = useState(null);
  const [launchStatus, setLaunchStatus] = useState(null); // 'signing' | 'deploying' | 'success'
  const [launchError, setLaunchError] = useState('');
  const [createdLaunch, setCreatedLaunch] = useState(null);

  const handleLaunch = async () => {
    if (!name || !ticker) {
      setLaunchError('Please provide a token name and symbol/ticker.');
      return;
    }
    if (!/^[1-9][0-9]*$/.test(supply)) {
      setLaunchError('Enter a whole-number supply greater than zero.');
      return;
    }
    setLaunchError('');
    setCreatedLaunch(null);
    setLaunchStatus('signing');

    try {
      setLaunchStatus('deploying');
      const chainLaunch = await createRexiLaunch({ name, symbol: ticker, rewardAsset, supply });
      setCreatedLaunch(chainLaunch);
      setLaunchStatus('success');
    } catch (err) {
      setLaunchStatus(null);
      setLaunchError(err.shortMessage || err.message || 'Launch failed. Check the Rexi service and try again.');
    }
  };

  // The split the deployed launchpad actually applies (REXI_FEE_SPLIT in deployments.js).
  const feeBreakdown = REXI_FEE_SPLIT;
  const rewardAssetInfo = REXI_REWARD_ASSETS.find(a => a.address === rewardAsset) || REXI_REWARD_ASSETS[0];

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

      {/* Supply */}
      <div className="form-section">
        <div className="field-header">
          <label>SUPPLY</label>
          <span className="char-count">whole tokens</span>
        </div>
        <p className="section-desc">
          Minted once, to your wallet, when the launch executes. Holders then earn {rewardAssetInfo?.symbol || 'the reward asset'} in
          proportion to their balance.
        </p>
        <input
          className="form-input"
          inputMode="numeric"
          placeholder={DEFAULT_SUPPLY}
          value={supply}
          onChange={e => setSupply(e.target.value.replace(/[^0-9]/g, ''))}
        />
      </div>

      {/* Reward Asset (real, on-chain) */}
      <div className="form-section">
        <label className="section-label">REWARD ASSET</label>
        <p className="section-desc">
          A real ERC-20 on Robinhood Chain that holders are paid in. On testnet the only deployed
          reward asset is the Rexi stand-in below.
        </p>
        <div className="reward-asset-row">
          {REXI_REWARD_ASSETS.map(asset => (
            <button
              key={asset.address}
              className={`reward-asset-btn ${rewardAsset === asset.address ? 'active' : ''}`}
              onClick={() => setRewardAsset(asset.address)}
            >
              <span className="reward-asset-symbol">{asset.symbol}</span>
              <span className="reward-asset-name">
                {asset.name}{asset.testnetOnly ? ' · testnet' : ''}
              </span>
              <span className="reward-asset-addr">
                <a
                  href={explorerAddressUrl(asset.address)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={e => e.stopPropagation()}
                >
                  {asset.address.slice(0, 10)}…{asset.address.slice(-6)}
                </a>
              </span>
            </button>
          ))}
        </div>
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
            <span>Robinhood Chain Testnet</span>
          </div>
          <div className="summary-row">
            <span>Launchpad</span>
            <span className="pair-val">
              <a href={explorerAddressUrl(REXI_LAUNCHPAD)} target="_blank" rel="noreferrer">
                {REXI_LAUNCHPAD.slice(0, 8)}…{REXI_LAUNCHPAD.slice(-6)}
              </a>
            </span>
          </div>
          <div className="summary-row">
            <span>Holders are paid in</span>
            <span className="pair-val">
              <span className="pair-dot">⬛</span> {rewardAssetInfo?.symbol}
            </span>
          </div>
          <div className="summary-row">
            <span>Supply</span>
            <span>{(supply || '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',')} {ticker ? `$${ticker}` : ''}</span>
          </div>
        </div>

        <div className="fee-breakdown">
          <div className="fee-breakdown-label">OF EVERY DISTRIBUTION</div>
          {feeBreakdown.map(item => (
            <div key={item.label} className="summary-row">
              <span>{item.label}</span>
              <span className="fee-val">{item.value}</span>
            </div>
          ))}
        </div>

        <p className="rent-note">
          No fee to launch: the launchpad deploys your ERC-20 and registers it against the reward asset
          {rewardAssetInfo ? ` (${rewardAssetInfo.symbol})` : ''}. Holders accrue the reward asset against their balance and claim it
          whenever they like.
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
              <strong>${ticker} deployed on Robinhood Chain Testnet</strong>
              <span>Holders now accrue {rewardAssetInfo?.symbol || selectedPair} rewards, pro-rata to their balance.</span>
              {createdLaunch?.token && (
                <span>
                  Token{' '}
                  <a className="tx-link" href={createdLaunch.tokenUrl} target="_blank" rel="noreferrer">
                    {createdLaunch.token}
                  </a>
                  {createdLaunch.txUrl && (
                    <>
                      {' · '}
                      <a className="tx-link" href={createdLaunch.txUrl} target="_blank" rel="noreferrer">
                        view launch transaction
                      </a>
                    </>
                  )}
                </span>
              )}
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
              ? 'Confirm in your wallet...'
              : launchStatus === 'deploying'
              ? 'Deploying on Robinhood Chain...'
              : 'Launch Token'}
          </button>
        )}
      </div>
    </div>
  );
}
