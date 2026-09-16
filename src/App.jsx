import { useState } from 'react';
import { WalletProvider, useWallet } from './context/WalletContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Explore from './pages/Explore';
import LaunchToken from './pages/LaunchToken';
import Rewards from './pages/Rewards';
import Revenue from './pages/Revenue';
import Desks from './pages/Desks';
import Analytics from './pages/Analytics';
import './App.css';

function ConnectErrorBanner() {
  const { connectError } = useWallet();
  if (!connectError) return null;
  return <div className="connect-error-banner">{connectError}</div>;
}

function Rexi() {
  const [page, setPage] = useState('Explore');

  const navigate = (target) => {
    setPage(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (page) {
      case 'Explore':      return <Explore onNavigate={navigate} />;
      case 'Launch token': return <LaunchToken />;
      case 'Rewards':      return <Rewards />;
      case 'Revenue':      return <Revenue />;
      case 'Desks':        return <Desks />;
      case 'Analytics':    return <Analytics />;
      default:             return <Explore onNavigate={navigate} />;
    }
  };

  return (
    <div className="app">
      <Navbar activePage={page} onNavigate={navigate} />
      <ConnectErrorBanner />
      <main className="main-content">
        {renderPage()}
      </main>
      <Footer onNavigate={navigate} />
    </div>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <Rexi />
    </WalletProvider>
  );
}
