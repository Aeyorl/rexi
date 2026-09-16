// Desks as they actually work: the desks treasury is paid 10% of every real
// distribution, so this page lists the live treasury balance and the desk
// share of each distribution, newest first. There is no desk NFT/mint program
// in the contracts, so this page shows payouts only.
import { useEffect, useState } from 'react';
import { fetchChainActivity } from '../services/api';
import './Desks.css';

export default function Desks() {
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      const data = await fetchChainActivity();
      if (!active) return;
      if (data) setActivity(data);
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, []);

  const symbol = activity?.totals?.assets?.[0]?.symbol || 'reward';
  const desksTreasuries = (activity?.treasuries ?? []).filter(t => t.role === 'desks' && !t.legacy);
  const distributions = activity?.distributions ?? [];

  return (
    <div className="desks-page">
      {/* Status bar with real on-chain numbers */}
      <div className="desks-status-bar">
        <div className="status-item">
          <span className="status-dot live"></span>
          <div>
            <div className="status-label">DESKS SHARE</div>
            <div className="status-val accent">10% of every distribution</div>
          </div>
        </div>
        <div className="status-item">
          <div className="status-label">EARNED, ALL TIME</div>
          <div className="status-val">{activity ? `${Number(activity.totals.desks).toLocaleString('en-US')} ${symbol}` : '—'}</div>
        </div>
        <div className="status-item">
          <div className="status-label">TREASURY BALANCE</div>
          <div className="status-val green">
            {desksTreasuries.length > 0
              ? desksTreasuries.flatMap(t => t.balances).map(b => `${Number(b.formatted).toLocaleString('en-US')} ${b.symbol}`).join(' · ')
              : '—'}
          </div>
        </div>
        <div className="status-item">
          <div className="status-label">DISTRIBUTIONS</div>
          <div className="status-val">{activity ? activity.totals.distributions : '—'}</div>
        </div>
      </div>

      {/* Desk share of each distribution */}
      <div className="desks-card">
        <div className="desks-tabs">
          <span className="desks-tab active">Desk payouts</span>
          <span className="desks-tab-sub">{loading ? 'Reading chain…' : `${distributions.length} events`}</span>
        </div>

        {distributions.length === 0 && (
          <div className="chart-empty">{loading ? 'Reading chain…' : 'No distributions yet.'}</div>
        )}
        {distributions.map(item => (
          <a
            key={item.txHash}
            className="desk-row animate-in"
            href={item.txUrl}
            target="_blank"
            rel="noreferrer"
          >
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
              <div className="desk-name">{item.name || item.symbol} · {item.ago}</div>
              <div className="desk-dots">
                {item.legacy ? 'legacy launchpad' : 'current launchpad'}
              </div>
            </div>
            <div className="desk-earned">
              <div className="desk-earned-val">{Number(item.desks).toLocaleString('en-US')} {item.rewardAssetSymbol}</div>
              <div className="desk-earned-label">EARNED</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}