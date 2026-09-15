import { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { REWARDS_STATS, TOP_DISTRIBUTIONS, RECENT_DISTRIBUTIONS } from '../data/mockData';
import './Rewards.css';
import { claimRewards } from '../services/rexiChain';

export default function Rewards() {
  const { connected, openModal, shortAddress } = useWallet();
  const [claimed, setClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const handleClaim = async () => {
    setClaiming(true);
    try {
      await claimRewards('0x795e81d64e7d95347a1c350ba465555df835a933');
      setClaiming(false);
      setClaimed(true);
    } catch (error) {
      setClaiming(false);
      window.alert(error.message || 'Claim failed');
    }
  };
  return (
    <div className="rewards">
      <div className="rewards-header">
        <h1 className="page-title">Rewards</h1>
        <p className="page-desc">
          Every coin launched here pays its holders. Fees are claimed from pump and the holders' share goes out pro-rata. Most coins pay in a reward stock the launcher picked. Some are launched paired against another asset, a token or a tokenised stock, and those pay in whatever they trade against.
        </p>
      </div>

      {/* User Connected Rewards Card */}
      <div className="user-rewards-card animate-in">
        {!connected ? (
          <div className="user-rewards-prompt">
            <div className="prompt-info">
              <span className="prompt-title">Check your pending stock & yield dividends</span>
              <span className="prompt-desc">Connect Robinhood to view and claim distributions from held assets.</span>
            </div>
            <button className="btn-connect-banner" onClick={openModal}>
              Connect Wallet
            </button>
          </div>
        ) : (
          <div className="user-rewards-active">
            <div className="user-rewards-left">
              <div className="user-pill-tag">
                <span className="active-dot" /> Connected as <code>{shortAddress}</code>
              </div>
              <div className="user-claimable-amount">
                {claimed ? '$0.00' : '$142.80'} 
                <span className="claimable-sub">Claimable Dividends (AAPLx, TSLAx, NVDAx)</span>
              </div>
            </div>
            <div className="user-rewards-right">
              {claimed ? (
                <div className="claimed-badge">
                  ✓ All rewards claimed!
                </div>
              ) : (
                <button
                  className="btn-claim-rewards"
                  disabled={claiming}
                  onClick={handleClaim}
                >
                  {claiming ? 'Claiming through Robinhood...' : 'Claim Dividends ($142.80)'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-label">TOTAL DISTRIBUTED</div>
          <div className="stat-card-val">{REWARDS_STATS.totalDistributed}</div>
          <div className="stat-card-sub">Paid to holders, valued now</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">DISTRIBUTIONS</div>
          <div className="stat-card-val">{REWARDS_STATS.distributions}</div>
          <div className="stat-card-sub">One per transaction, not per holder</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">PAYING TOKENS</div>
          <div className="stat-card-val">{REWARDS_STATS.payingTokens}</div>
          <div className="stat-card-sub">Have distributed at least once</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">HOLDER PAYOUTS</div>
          <div className="stat-card-val">{REWARDS_STATS.holderPayouts}</div>
          <div className="stat-card-sub">Wallets paid, counted per token</div>
        </div>
      </div>

      {/* Top Distributions */}
      <div className="rewards-section">
        <div className="section-header">
          <h2>Top distributions</h2>
          <span className="section-sub">Ranked by total paid</span>
        </div>
        <div className="top-dist-list">
          {TOP_DISTRIBUTIONS.map(item => (
            <div key={item.rank} className="top-dist-row">
              <div className="dist-rank">{item.rank}</div>
              <div className="dist-avatar">
                {item.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="dist-info">
                <span className="dist-name">{item.name}</span>
                <span className="dist-meta">
                  {item.symbol} · pays {item.pays} · {item.payCount} paid
                </span>
              </div>
              <div className="dist-right">
                <div className="dist-total">{item.total}</div>
                <div className="dist-mcap">{item.mcap} mcap</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Distributions */}
      <div className="rewards-section">
        <div className="section-header">
          <h2>Recent distributions</h2>
          <span className="section-sub">Newest first</span>
        </div>
        <div className="recent-dist-list">
          {RECENT_DISTRIBUTIONS.map((item, i) => (
            <div key={i} className="recent-dist-row">
              <div className="recent-dist-avatar">
                {item.symbol.slice(1, 3).toUpperCase()}
              </div>
              <div className="recent-dist-info">
                <span className="recent-dist-symbol">{item.symbol}</span>
                <span className="recent-dist-meta">{item.holders} holders · {item.time}</span>
              </div>
              <div className="recent-dist-right">
                <span className="recent-dist-amount">{item.amount}</span>
                <span className="recent-dist-token">{item.token}</span>
              </div>
              <button className="dist-arrow">›</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
