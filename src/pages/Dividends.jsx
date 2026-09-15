import './Dividends.css';

const DIVIDEND_ROWS = [
  { token: '$Nasduck', pays: 'QQQx', yield: '14.2%', freq: 'Per trade', last: '$132,740', holders: '1,805' },
  { token: '$GPRO', pays: 'GPRO', yield: '9.8%', freq: 'Per trade', last: '$128,652', holders: '950' },
  { token: '$Pumpcat', pays: 'PUMP', yield: '8.1%', freq: 'Per trade', last: '$99,189', holders: '2,988' },
  { token: '$CTO', pays: 'OTC', yield: '6.4%', freq: 'Per trade', last: '$78,010', holders: '744' },
  { token: '$Anonymouse', pays: 'ZEC', yield: '5.9%', freq: 'Per trade', last: '$53,320', holders: '1,200' },
  { token: '$HaWG', pays: 'etORE', yield: '4.7%', freq: 'Per trade', last: '$47,860', holders: '620' },
];

export default function Dividends() {
  return (
    <div className="dividends-page">
      <div className="dividends-header">
        <h1 className="page-title">Dividends</h1>
        <p className="dividends-desc">
          Every trade generates fees. Those fees flow directly to token holders, distributed automatically on-chain. No claiming required — rewards are sent to your wallet.
        </p>
      </div>

      <div className="dividends-stats">
        <div className="div-stat">
          <div className="div-stat-label">TOTAL PAID OUT</div>
          <div className="div-stat-val">$1.82M</div>
        </div>
        <div className="div-stat">
          <div className="div-stat-label">ACTIVE PAIRS</div>
          <div className="div-stat-val">17,452</div>
        </div>
        <div className="div-stat">
          <div className="div-stat-label">AVG YIELD</div>
          <div className="div-stat-val green">8.2%</div>
        </div>
        <div className="div-stat">
          <div className="div-stat-label">NEXT DISTRIBUTION</div>
          <div className="div-stat-val">~2 min</div>
        </div>
      </div>

      <div className="dividends-table-card">
        <div className="div-table-header">
          <span>Token</span>
          <span>Pays</span>
          <span>Est. Yield</span>
          <span>Frequency</span>
          <span>Total Paid</span>
          <span>Holders</span>
        </div>
        {DIVIDEND_ROWS.map((row, i) => (
          <div key={i} className="div-row">
            <div className="div-token-cell">
              <div className="div-avatar">{row.token.slice(1, 3).toUpperCase()}</div>
              <span className="div-token-sym">{row.token}</span>
            </div>
            <div className="div-cell">
              <span className="div-pays-badge">{row.pays}</span>
            </div>
            <div className="div-cell green">{row.yield}</div>
            <div className="div-cell muted">{row.freq}</div>
            <div className="div-cell">{row.last}</div>
            <div className="div-cell muted">{row.holders}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
