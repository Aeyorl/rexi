import './Footer.css';

export default function Footer({ onNavigate }) {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="footer-logo">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="1" y="1" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <rect x="3" y="3" width="14" height="10" rx="1" fill="currentColor" opacity="0.2"/>
              <rect x="3" y="3" width="14" height="10" rx="1" stroke="currentColor" strokeWidth="1" fill="none"/>
              <rect x="5" y="5" width="10" height="6" fill="currentColor" opacity="0.5"/>
              <rect x="6" y="14" width="8" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="4" y="16.5" width="12" height="1" rx="0.5" fill="currentColor" opacity="0.5"/>
            </svg>
            <span>BOOL</span>
          </div>
          <p className="footer-tagline">Launch assets. Earn stocks.</p>
        </div>

        <div className="footer-cols">
          <div className="footer-col">
            <h4>PROTOCOL</h4>
            <button onClick={() => onNavigate('Desks')}>Desks</button>
            <button onClick={() => onNavigate('Launch token')}>Launch a coin</button>
          </div>
          <div className="footer-col">
            <h4>LAUNCHER</h4>
            <button onClick={() => onNavigate('Explore')}>Coins</button>
            <button onClick={() => onNavigate('Launch token')}>Launch a coin</button>
            <button onClick={() => onNavigate('Analytics')}>Analytics</button>
          </div>
          <div className="footer-col">
            <h4>MORE</h4>
            <button onClick={() => onNavigate('Revenue')}>Revenue</button>
            <button onClick={() => onNavigate('Rewards')}>Rewards</button>
          </div>
          <div className="footer-col">
            <h4>SOCIAL</h4>
            <a href="https://x.com" target="_blank" rel="noreferrer">X</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
