import { useState } from 'react';
import { ANALYTICS_STATS } from '../data/mockData';
import BarChart from '../components/BarChart';
import './Analytics.css';

const SUBTABS = ['Launchpad', 'Buybacks', 'Desks'];
const TIME_FILTERS = ['24 hours', 'All time'];

export default function Analytics() {
  const [subTab, setSubTab] = useState('Launchpad');
  const [timeFilter, setTimeFilter] = useState('All time');

  return (
    <div className="analytics">
      {/* Sub tabs + time filter */}
      <div className="analytics-controls">
        <div className="subtab-group">
          {SUBTABS.map(t => (
            <button
              key={t}
              className={`subtab-btn ${subTab === t ? 'active' : ''}`}
              onClick={() => setSubTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="time-group">
          {TIME_FILTERS.map(t => (
            <button
              key={t}
              className={`time-btn ${timeFilter === t ? 'active' : ''}`}
              onClick={() => setTimeFilter(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="analytics-stats-card">
        <div className="analytics-stat">
          <div className="analytics-stat-label">Paid to holders</div>
          <div className="analytics-stat-val">
            {ANALYTICS_STATS.paidToHolders} <span className="unit">SOL</span>
          </div>
        </div>
        <div className="analytics-stat">
          <div className="analytics-stat-label">Fees claimed</div>
          <div className="analytics-stat-val">
            {ANALYTICS_STATS.feesClaimed} <span className="unit">SOL</span>
          </div>
        </div>
        <div className="analytics-stat">
          <div className="analytics-stat-label">Volume, all time</div>
          <div className="analytics-stat-val">{ANALYTICS_STATS.volumeAllTime}</div>
        </div>
        <div className="analytics-stat">
          <div className="analytics-stat-label">Locked for pre-stocks</div>
          <div className="analytics-stat-val">
            {ANALYTICS_STATS.lockedPreStocks} <span className="unit">SOL</span>
          </div>
        </div>
      </div>

      {/* Fees Chart */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>Fees claimed, by day</h3>
          <span className="chart-date">Sep 15</span>
        </div>
        <div className="chart-main-val">248.17 SOL</div>
        <div className="chart-area">
          <BarChart />
        </div>
        <div className="chart-x-labels">
          <span>Sep 2</span>
          <span>Sep 8</span>
          <span>Sep 15</span>
        </div>
      </div>

      {/* Holders Chart */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>Paid to holders, by day</h3>
          <span className="chart-date">Sep 15</span>
        </div>
        <div className="chart-main-val">173.71 SOL</div>
        <div className="chart-area">
          <BarChart />
        </div>
        <div className="chart-x-labels">
          <span>Sep 2</span>
          <span>Sep 8</span>
          <span>Sep 15</span>
        </div>
      </div>
    </div>
  );
}
