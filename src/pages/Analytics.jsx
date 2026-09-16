// Analytics over real on-chain distributions: totals, the daily series of
// what holders earned and what fees each distribution paid, and the full
// distribution history with explorer links. Nothing here is sampled.
import { useEffect, useState } from 'react';
import { fetchChainActivity } from '../services/api';
import BarChart from '../components/BarChart';
import './Analytics.css';

export default function Analytics() {
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

  const asset = activity?.totals?.assets?.[0];
  const symbol = asset?.symbol || 'reward';
  const days = activity?.byDay ?? [];
  const distributions = activity?.distributions ?? [];

  return (
    <div className="analytics">
      <div className="analytics-controls">
        <h1 className="page-title">Analytics</h1>
        <span className="section-sub">
          {loading
            ? 'Reading Robinhood Chain…'
            : `${activity?.totals?.distributions ?? 0} distributions indexed · generated ${activity?.generatedAt ? new Date(activity.generatedAt).toLocaleString() : ''}`}
        </span>
      </div>

      {/* Summary Stats */}
      <div className="analytics-stats-card">
        <div className="analytics-stat">
          <div className="analytics-stat-label">Paid to holders</div>
          <div className="analytics-stat-val">
            {activity ? Number(activity.totals.holders).toLocaleString('en-US') : '—'} <span className="unit">{symbol}</span>
          </div>
        </div>
        <div className="analytics-stat">
          <div className="analytics-stat-label">Fees paid</div>
          <div className="analytics-stat-val">
            {activity
              ? (Number(activity.totals.protocol) + Number(activity.totals.desks) + Number(activity.totals.buybacks) + Number(activity.totals.platformOps)).toLocaleString('en-US')
              : '—'} <span className="unit">{symbol}</span>
          </div>
        </div>
        <div className="analytics-stat">
          <div className="analytics-stat-label">Volume distributed, all time</div>
          <div className="analytics-stat-val">
            {activity ? Number(activity.totals.distributed).toLocaleString('en-US') : '—'}
          </div>
        </div>
        <div className="analytics-stat">
          <div className="analytics-stat-label">Distributions</div>
          <div className="analytics-stat-val">
            {activity ? activity.totals.distributions : '—'}
          </div>
        </div>
      </div>

      {/* Holders Chart — real daily totals */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>Paid to holders, by day</h3>
          <span className="chart-date">{symbol}</span>
        </div>
        {days.length > 0 ? (
          <>
            <div className="chart-main-val">{Number(days[days.length - 1].holders).toLocaleString('en-US')} {symbol}</div>
            <div className="chart-area">
              <BarChart values={days.map(d => d.holders)} />
            </div>
            <div className="chart-x-labels">
              <span>{days[0].day}</span>
              <span>{days[Math.floor(days.length / 2)].day}</span>
              <span>{days[days.length - 1].day}</span>
            </div>
          </>
        ) : (
          <div className="chart-empty">{loading ? 'Indexing…' : 'No distributions yet.'}</div>
        )}
      </div>

      {/* Fees Chart — real daily totals */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>Fees paid, by day</h3>
          <span className="chart-date">{symbol}</span>
        </div>
        {days.length > 0 ? (
          <>
            <div className="chart-main-val">{Number(days[days.length - 1].fees).toLocaleString('en-US')} {symbol}</div>
            <div className="chart-area">
              <BarChart values={days.map(d => d.fees)} color="#4ec994" />
            </div>
            <div className="chart-x-labels">
              <span>{days[0].day}</span>
              <span>{days[Math.floor(days.length / 2)].day}</span>
              <span>{days[days.length - 1].day}</span>
            </div>
          </>
        ) : (
          <div className="chart-empty">{loading ? 'Indexing…' : 'No distributions yet.'}</div>
        )}
      </div>

      {/* Distribution history */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>Distributions</h3>
          <span className="chart-date">newest first</span>
        </div>
        {(distributions.length === 0) && (
          <div className="chart-empty">{loading ? 'Indexing…' : 'Nothing distributed yet.'}</div>
        )}
        {distributions.slice(0, 10).map(item => (
          <a key={item.txHash} className="dist-history-row" href={item.txUrl} target="_blank" rel="noreferrer">
            <span className="dist-history-token">${item.symbol}</span>
            <span className="dist-history-meta">{item.amount} {item.rewardAssetSymbol} · {item.ago}</span>
            <span className="dist-history-right">{item.holders} to holders</span>
          </a>
        ))}
      </div>
    </div>
  );
}