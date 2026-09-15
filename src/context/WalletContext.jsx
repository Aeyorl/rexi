import { createContext, useContext, useState, useEffect } from 'react';
import { submitRobinhoodOrder, depositRobinhoodFunds, fetchRobinhoodAccount } from '../services/api';
import { connectRobinhoodChain } from '../services/robinhoodChain';

const WalletContext = createContext(null);

const ROBINHOOD_STORAGE_KEY = 'rexi_robinhood_session';

const INITIAL_HOLDINGS = [
  { symbol: 'AAPLx', name: 'Apple Inc. Tokenized', shares: 12.5, price: 228.40, total: 2855.00 },
  { symbol: 'TSLAx', name: 'Tesla Inc. Tokenized', shares: 8.0, price: 214.20, total: 1713.60 },
  { symbol: 'NVDAx', name: 'NVIDIA Corp. Tokenized', shares: 15.0, price: 128.50, total: 1927.50 },
  { symbol: 'HOODx', name: 'Robinhood Markets', shares: 150.0, price: 24.80, total: 3720.00 },
  { symbol: 'SPACEX', name: 'SpaceX Pre-IPO', shares: 5.0, price: 920.00, total: 4600.00 }
];

export function WalletProvider({ children }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [activeTradeAsset, setActiveTradeAsset] = useState(null);

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [walletType, setWalletType] = useState(null); // 'robinhood_wallet' | 'robinhood_connect' | 'demo'
  const [walletName, setWalletName] = useState(null);
  const [accountNumber, setAccountNumber] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [buyingPower, setBuyingPower] = useState(10000.00);
  const [holdings, setHoldings] = useState(INITIAL_HOLDINGS);

  // Calculate total portfolio value
  const totalHoldingsValue = holdings.reduce((sum, h) => sum + (h.shares * h.price), 0);
  const totalAccountValue = buyingPower + totalHoldingsValue;

  // Restore session
  useEffect(() => {
    try {
      const saved = localStorage.getItem(ROBINHOOD_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.connected) {
          setConnected(true);
          setWalletType(parsed.walletType || 'robinhood_wallet');
          setWalletName(parsed.walletName || 'Robinhood Wallet');
          setAccountNumber(parsed.accountNumber || 'RH-8492-1084');
          setWalletAddress(parsed.walletAddress || '0x49e...82a9');
          setBuyingPower(parsed.buyingPower ?? 10000.00);
          if (parsed.holdings) setHoldings(parsed.holdings);
        }
      }
    } catch (e) {
      console.warn('Failed to restore Robinhood session', e);
    }
  }, []);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const openTradeModal = (asset) => {
    setActiveTradeAsset(asset);
    setTradeModalOpen(true);
  };
  const closeTradeModal = () => {
    setTradeModalOpen(false);
    setActiveTradeAsset(null);
  };

  const connect = async (method = 'robinhood_wallet') => {
    setConnecting(true);

    try {
      const chainAddress = method === 'demo' ? null : await connectRobinhoodChain();

      let name = 'Robinhood Wallet';
      let type = method;
      let acct = 'RH-8492-1084';
      let addr = chainAddress || null;

      if (method === 'robinhood_connect') {
        name = 'Robinhood Connect';
        acct = 'RH-CONNECT-9402';
      } else if (method === 'demo') {
        name = 'Robinhood Instant Demo';
        acct = 'RH-DEMO-5512';
      }

      const account = method === 'demo' ? null : await fetchRobinhoodAccount();
      if (account) {
        acct = account.accountNumber || acct;
        name = account.walletName || name;
        setBuyingPower(account.buyingPower ?? buyingPower);
        setHoldings(account.holdings || holdings);
      }

      setConnected(true);
      setWalletType(type);
      setWalletName(name);
      setAccountNumber(acct);
      setWalletAddress(addr);

      localStorage.setItem(ROBINHOOD_STORAGE_KEY, JSON.stringify({
        connected: true,
        walletType: type,
        walletName: name,
        accountNumber: acct,
        walletAddress: addr,
        buyingPower,
        holdings
      }));
    } finally {
      setConnecting(false);
      setIsModalOpen(false);
    }
  };

  const disconnect = () => {
    setConnected(false);
    setWalletType(null);
    setWalletName(null);
    setAccountNumber(null);
    setWalletAddress(null);
    localStorage.removeItem(ROBINHOOD_STORAGE_KEY);
  };

  const executeTrade = async ({ symbol, name, price, action, amountUsd, sharesCount }) => {
    if (action === 'BUY') {
      if (amountUsd > buyingPower) {
        throw new Error('Insufficient Robinhood buying power');
      }
      setBuyingPower(prev => prev - amountUsd);
      setHoldings(prev => {
        const existing = prev.find(h => h.symbol === symbol);
        if (existing) {
          return prev.map(h => h.symbol === symbol
            ? { ...h, shares: +(h.shares + sharesCount).toFixed(4), total: +((h.shares + sharesCount) * price).toFixed(2) }
            : h
          );
        } else {
          return [...prev, { symbol, name: name || symbol, shares: +sharesCount.toFixed(4), price, total: +amountUsd.toFixed(2) }];
        }
      });
    } else if (action === 'SELL') {
      setBuyingPower(prev => prev + amountUsd);
      setHoldings(prev => {
        return prev
          .map(h => {
            if (h.symbol === symbol) {
              const newShares = Math.max(0, +(h.shares - sharesCount).toFixed(4));
              return { ...h, shares: newShares, total: +(newShares * price).toFixed(2) };
            }
            return h;
          })
          .filter(h => h.shares > 0);
      });
    }

    // Persist to backend
    try {
      await submitRobinhoodOrder({ symbol, name, price, action, amountUsd, sharesCount });
    } catch (err) {
      console.warn('Backend order persistence note:', err);
    }
  };

  const depositFunds = async (amount) => {
    setBuyingPower(prev => prev + amount);
    try {
      const result = await depositRobinhoodFunds(amount);
      if (result?.buyingPower != null) setBuyingPower(result.buyingPower);
    } catch (err) {
      console.warn('Backend deposit sync note:', err);
    }
  };

  return (
    <WalletContext.Provider value={{
      connected,
      connecting,
      walletType,
      walletName,
      accountNumber,
      walletAddress,
      buyingPower,
      totalHoldingsValue,
      totalAccountValue,
      holdings,
      isModalOpen,
      openModal,
      closeModal,
      tradeModalOpen,
      activeTradeAsset,
      openTradeModal,
      closeTradeModal,
      connect,
      disconnect,
      executeTrade,
      depositFunds
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
