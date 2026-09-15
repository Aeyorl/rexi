import BarChart from '../components/BarChart';
import './Revenue.css';

const REVENUE_ROWS = [
  { label: 'Launchpad fees', value: '$2.1M', sub: 'All time', pct: 50 },
  { label: 'Trading fees (OTC share)', value: '$1.4M', sub: 'All time', pct: 33 },
  { label: 'Desk mints', value: '$480K', sub: 'All time', pct: 11 },
  { label: 'Buyback revenue', value: '$220K', sub: 'All time', pct: 6 },
];

export default function Revenue() {
  return (
    <div className="revenue-page">
      <h1 className="page-title">Revenue</h1>

      <div className="revenue-summary">
        <div className="rev-stat">
          <div className="rev-stat-label">TOTAL REVENUE</div>
          <div className="rev-stat-val">$4.2M</div>
          <div className="rev-stat-sub">All time protocol revenue</div>
        </div>
        <div className="rev-stat">
          <div className="rev-stat-label">LAST 24H</div>
          <div className="rev-stat-val green">$48.3K</div>
          <div className="rev-stat-sub">+12.4% vs yesterday</div>
        </div>
        <div className="rev-stat">
          <div className="rev-stat-label">LAST 7 DAYS</div>
          <div className="rev-stat-val">$312.8K</div>
          <div className="rev-stat-sub">Rolling 7-day window</div>
        </div>
      </div>

      <div className="revenue-chart-card">
        <div className="rev-chart-header">
          <h3>Revenue, by day</h3>
          <span className="rev-chart-sub">Sep 15</span>
        </div>
        <div className="rev-chart-val">$48.3K</div>
        <div className="rev-chart-area">
          <BarChart color="#8fb339" />
        </div>
        <div className="rev-chart-labels">
          <span>Sep 2</span><span>Sep 8</span><span>Sep 15</span>
        </div>
      </div>

      <div className="revenue-breakdown-card">
        <h3>Revenue breakdown</h3>
        {REVENUE_ROWS.map(row => (
          <div key={row.label} className="rev-row">
            <div className="rev-row-info">
              <span className="rev-row-label">{row.label}</span>
              <span className="rev-row-sub">{row.sub}</span>
            </div>
            <div className="rev-row-bar-wrap">
              <div className="rev-row-bar" style={{ width: `${row.pct}%` }} />
            </div>
            <div className="rev-row-val">{row.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
