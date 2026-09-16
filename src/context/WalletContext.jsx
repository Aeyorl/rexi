// Rexi wallet state: a real EVM wallet on Robinhood Chain — nothing simulated.
//
// Connecting requests accounts from the injected provider and switches it to
// Robinhood Chain Testnet. The session persists only the address and chain so a
// reload can show the same pill; balances and holdings always come from chain reads.
import { createContext, useContext, useState } from 'react';
import { connectRobinhoodChain, ROBINHOOD_CHAIN_TESTNET } from '../services/robinhoodChain';
import { shortAddress as formatShortAddress } from '../services/deployments';

const WalletContext = createContext(null);

const REXI_SESSION_KEY = 'rexi_wallet_session';

function readSavedSession() {
  try {
    const saved = localStorage.getItem(REXI_SESSION_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (parsed?.connected && typeof parsed?.walletAddress === 'string') return parsed;
    return null;
  } catch (e) {
    console.warn('Failed to restore wallet session', e);
    return null;
  }
}

export function WalletProvider({ children }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // The stored session is read once on first render instead of in an effect.
  const [restored] = useState(readSavedSession);

  const [connected, setConnected] = useState(Boolean(restored));
  const [connecting, setConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState(restored?.walletAddress || null);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const shortAddress = walletAddress ? formatShortAddress(walletAddress) : null;

  const connect = async () => {
    setConnecting(true);
    try {
      const address = await connectRobinhoodChain();
      setConnected(true);
      setWalletAddress(address);
      localStorage.setItem(REXI_SESSION_KEY, JSON.stringify({
        connected: true,
        walletAddress: address,
        chainId: ROBINHOOD_CHAIN_TESTNET.chainIdDecimal
      }));
    } finally {
      setConnecting(false);
      setIsModalOpen(false);
    }
  };

  const disconnect = () => {
    setConnected(false);
    setWalletAddress(null);
    localStorage.removeItem(REXI_SESSION_KEY);
  };

  return (
    <WalletContext.Provider value={{
      connected,
      connecting,
      walletAddress,
      shortAddress,
      chainId: ROBINHOOD_CHAIN_TESTNET.chainIdDecimal,
      chainName: ROBINHOOD_CHAIN_TESTNET.chainName,
      isModalOpen,
      openModal,
      closeModal,
      connect,
      disconnect
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