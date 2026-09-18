import './Footer.css';

export default function Footer({ onNavigate }) {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="footer-logo">
            <img className="bool-logo" src="/brand/bool-logo.svg" alt="Bool" width="126" height="40" />
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
