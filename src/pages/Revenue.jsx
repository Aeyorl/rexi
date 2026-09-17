// Revenue as the protocol actually earns it: the cumulative fee split across
// every real distribution, plus the balances each treasury currently holds
// on-chain. No projections, no samples.
import { useEffect, useState } from 'react';
import { fetchChainActivity } from '../services/api';
import './Revenue.css';

export default function Revenue() {
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

  const totals = activity?.totals;
  const symbol = activity?.byAsset?.[0]?.symbol || activity?.totals?.assets?.[0]?.symbol || 'WETH';

  function formatCryptoAmount(num) {
    if (num === null || num === undefined) return '0';
    const val = Number(num);
    if (isNaN(val)) return String(num);
    if (val === 0) return '0';
    if (val < 0.001) return val.toFixed(7).replace(/0+$/, '').replace(/\.$/, '');
    return val.toLocaleString('en-US', { maximumFractionDigits: 4 });
  }

  const rows = totals ? [
    { label: 'Holders (67.5%)', value: Number(totals.holders), sub: 'Reward asset paid to launch-token holders' },
    { label: 'Desks (10%)', value: Number(totals.desks), sub: `Desks treasury across ${activity.treasuries.filter(t => t.role === 'desks' && !t.legacy).length} live launchpad(s)` },
    { label: 'Protocol (5%)', value: Number(totals.protocol), sub: 'Protocol treasury' },
    { label: 'Buybacks (10%)', value: Number(totals.buybacks), sub: 'Buyback treasury' },
    { label: 'Platform operations (7.5%)', value: Number(totals.platformOps), sub: 'Retained in the launchpad' }
  ] : [];
  const maxRow = Math.max(1, ...rows.map(r => r.value));

  const liveTreasuries = (activity?.treasuries ?? []).filter(t => !t.legacy);

  return (
    <div className="revenue-page">
      <h1 className="page-title">Revenue</h1>

      <div className="revenue-summary">
        <div className="rev-stat">
          <div className="rev-stat-label">DISTRIBUTED, ALL TIME</div>
          <div className="rev-stat-val">
            {totals ? `${formatCryptoAmount(totals.distributed)} ${symbol}` : '—'}
          </div>
          <div className="rev-stat-sub">{loading ? 'Reading chain…' : `${totals?.distributions ?? 0} distributions indexed`}</div>
        </div>
        <div className="rev-stat">
          <div className="rev-stat-label">PAID TO HOLDERS</div>
          <div className="rev-stat-val green">
            {totals ? `${formatCryptoAmount(totals.holders)} ${symbol}` : '—'}
          </div>
          <div className="rev-stat-sub">67.5% of every distribution</div>
        </div>
        <div className="rev-stat">
          <div className="rev-stat-label">FEES, ALL TIME</div>
          <div className="rev-stat-val">
            {totals
              ? `${formatCryptoAmount(Number(totals.protocol) + Number(totals.desks) + Number(totals.buybacks) + Number(totals.platformOps))} ${symbol}`
              : '—'}
          </div>
          <div className="rev-stat-sub">Protocol + desks + buybacks + operations</div>
        </div>
      </div>

      <div className="revenue-breakdown-card">
        <h3>Revenue breakdown</h3>
        {rows.length === 0 && <div className="chart-empty">{loading ? 'Reading chain…' : 'No fee activity yet.'}</div>}
        {rows.map(row => (
          <div key={row.label} className="rev-row">
            <div className="rev-row-info">
              <span className="rev-row-label">{row.label}</span>
              <span className="rev-row-sub">{row.sub}</span>
            </div>
            <div className="rev-row-bar-wrap">
              <div className="rev-row-bar" style={{ width: `${(row.value / maxRow) * 100}%` }} />
            </div>
            <div className="rev-row-val">{formatCryptoAmount(row.value)} {symbol}</div>
          </div>
        ))}
      </div>

      <div className="revenue-breakdown-card">
        <h3>Treasury balances, live</h3>
        {liveTreasuries.length === 0 && <div className="chart-empty">{loading ? 'Reading chain…' : 'No treasuries found.'}</div>}
        {liveTreasuries.map(t => (
          <div key={`${t.launchpad}-${t.role}`} className="rev-row">
            <div className="rev-row-info">
              <span className="rev-row-label">
                <a className="tx-link" href={t.addressUrl} target="_blank" rel="noreferrer">{t.role}</a>
              </span>
              <span className="rev-row-sub">{t.address.slice(0, 10)}…{t.address.slice(-6)}</span>
            </div>
            <div className="rev-row-val">
              {t.balances.map(b => `${formatCryptoAmount(b.formatted)} ${b.symbol}`).join(' · ') || '—'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}