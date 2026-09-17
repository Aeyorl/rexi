// Rexi wallet state: a real EVM wallet on Robinhood Chain — nothing simulated.
//
// There is no connect modal: `connect()` talks to the injected wallet directly
// and the outcome is reflected in `connectStatus` / `connectError` so the UI can
// show it inline. A hung or popup-blocked wallet request times out instead of
// leaving the page spinning forever.
import { createContext, useContext, useState } from 'react';
import { connectRobinhoodChain, ACTIVE_CHAIN } from '../services/robinhoodChain';
import { shortAddress as formatShortAddress } from '../services/deployments';

const WalletContext = createContext(null);

const REXI_SESSION_KEY = 'rexi_wallet_session';
const CONNECT_TIMEOUT_MS = 90000;

function withTimeout(promise, ms, message) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), ms);
    })
  ]).finally(() => clearTimeout(timer));
}

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
  // The stored session is read once on first render instead of in an effect.
  const [restored] = useState(readSavedSession);

  const [connected, setConnected] = useState(Boolean(restored));
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState('');
  const [walletAddress, setWalletAddress] = useState(restored?.walletAddress || null);

  const shortAddress = walletAddress ? formatShortAddress(walletAddress) : null;

  const connect = async () => {
    if (connecting) return null;
    setConnecting(true);
    setConnectError('');
    try {
      const address = await withTimeout(
        connectRobinhoodChain(),
        CONNECT_TIMEOUT_MS,
        'Your wallet did not respond. If no wallet window appeared, allow popups for this site and try again.'
      );
      setConnected(true);
      setWalletAddress(address);
      localStorage.setItem(REXI_SESSION_KEY, JSON.stringify({
        connected: true,
        walletAddress: address,
        chainId: ACTIVE_CHAIN.chainIdDecimal
      }));
      return address;
    } catch (err) {
      setConnectError(err?.message || 'Wallet connection failed.');
      return null;
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = () => {
    setConnected(false);
    setWalletAddress(null);
    setConnectError('');
    localStorage.removeItem(REXI_SESSION_KEY);
  };

  return (
    <WalletContext.Provider value={{
      connected,
      connecting,
      connectError,
      walletAddress,
      shortAddress,
      chainId: ACTIVE_CHAIN.chainIdDecimal,
      chainName: ACTIVE_CHAIN.chainName,
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
