import { useState } from 'react';
import { WalletProvider } from './context/WalletContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WalletModal from './components/WalletModal';
import RobinhoodTradeModal from './components/RobinhoodTradeModal';
import Explore from './pages/Explore';
import LaunchToken from './pages/LaunchToken';
import SPL404 from './pages/SPL404';
import Rewards from './pages/Rewards';
import Revenue from './pages/Revenue';
import Dividends from './pages/Dividends';
import Desks from './pages/Desks';
import Analytics from './pages/Analytics';
import './App.css';

export default function App() {
  const [page, setPage] = useState('Explore');

  const navigate = (target) => {
    setPage(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (page) {
      case 'Explore':      return <Explore onNavigate={navigate} />;
      case 'Launch token': return <LaunchToken />;
      case 'SPL-404':      return <SPL404 />;
      case 'Rewards':      return <Rewards />;
      case 'Revenue':      return <Revenue />;
      case 'Dividends':    return <Dividends />;
      case 'Desks':        return <Desks />;
      case 'Analytics':    return <Analytics />;
      default:             return <Explore onNavigate={navigate} />;
    }
  };

  return (
    <WalletProvider>
      <div className="app">
        <Navbar activePage={page} onNavigate={navigate} />
        <main className="main-content">
          {renderPage()}
        </main>
        <Footer onNavigate={navigate} />
        <WalletModal />
        <RobinhoodTradeModal />
      </div>
    </WalletProvider>
  );
}
