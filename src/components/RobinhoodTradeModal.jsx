import { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import './RobinhoodTradeModal.css';

// Default asset fallback if none passed
const DEFAULT_ASSET = {
  symbol: 'AAPLx',
  name: 'Apple Inc. Tokenized',
  price: 228.40,
  change: '+1.8%',
  category: 'xStock'
};

export default function RobinhoodTradeModal() {
  const { tradeModalOpen, activeTradeAsset } = useWallet();

  if (!tradeModalOpen) return null;

  const asset = activeTradeAsset || DEFAULT_ASSET;

  // Remounting the ticket when the modal opens (or the asset changes) resets the
  // form, so no state-resetting effect is needed.
  return <TradeTicket key={asset.symbol} asset={asset} />;
}

function TradeTicket({ asset }) {
  const {
    closeTradeModal,
    buyingPower,
    holdings,
    executeTrade,
    connected,
    openModal
  } = useWallet();

  const [orderType, setOrderType] = useState('BUY'); // 'BUY' | 'SELL'
  const [amountUsd, setAmountUsd] = useState('250');
  const [submitting, setSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [tradeError, setTradeError] = useState('');

  const assetPrice = asset.price || 100.00;

  // Existing holding for this asset
  const existingHolding = holdings.find(h => h.symbol === asset.symbol);
  const userShares = existingHolding ? existingHolding.shares : 0;

  // Calculate corresponding values
  const numericUsd = parseFloat(amountUsd) || 0;
  const computedShares = +(numericUsd / assetPrice).toFixed(4);

  const handleSubmitOrder = () => {
    if (!connected) {
      openModal();
      return;
    }

    if (orderType === 'BUY' && numericUsd > buyingPower) {
      setTradeError(`Order exceeds available Robinhood buying power ($${buyingPower.toLocaleString('en-US', { minimumFractionDigits: 2 })}).`);
      return;
    }

    if (orderType === 'SELL' && computedShares > userShares) {
      setTradeError(`You only own ${userShares} shares of ${asset.symbol}.`);
      return;
    }

    setTradeError('');
    setSubmitting(true);

    setTimeout(() => {
      try {
        executeTrade({
          symbol: asset.symbol,
          name: asset.name,
          price: assetPrice,
          action: orderType,
          amountUsd: numericUsd,
          sharesCount: computedShares
        });
        setSubmitting(false);
        setOrderComplete(true);
      } catch (err) {
        setSubmitting(false);
        setTradeError(err.message || 'Trade failed');
      }
    }, 700);
  };

  return (
    <div className="rh-trade-overlay" onClick={closeTradeModal}>
      <div className="rh-trade-card animate-in" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="rh-trade-header">
          <div className="rh-trade-asset-meta">
            <div className="rh-trade-avatar">
              {asset.symbol.slice(0, 3)}
            </div>
            <div>
              <div className="rh-trade-title">{asset.name}</div>
              <div className="rh-trade-price-row">
                <span className="rh-trade-symbol">{asset.symbol}</span>
                <span className="rh-trade-price">${assetPrice.toFixed(2)}</span>
                <span className="rh-trade-tag">0% Commission</span>
              </div>
            </div>
          </div>
          <button className="rh-trade-close" onClick={closeTradeModal}>
            ✕
          </button>
        </div>

        {orderComplete ? (
          <div className="rh-trade-success animate-in">
            <div className="success-feather-circle">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17L4 12" stroke="#00c805" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="success-order-title">Order Filled!</h3>
            <p className="success-order-desc">
              Successfully {orderType === 'BUY' ? 'purchased' : 'sold'} <strong>{computedShares} shares</strong> of {asset.symbol} for <strong>${numericUsd.toFixed(2)} USD</strong>.
            </p>
            <div className="success-receipt">
              <div className="receipt-row">
                <span>Account</span>
                <span>Robinhood Brokerage</span>
              </div>
              <div className="receipt-row">
                <span>Execution Price</span>
                <span>${assetPrice.toFixed(2)} / share</span>
              </div>
              <div className="receipt-row">
                <span>Dividend Eligibility</span>
                <span className="text-green">Active (AAPL stock yield)</span>
              </div>
            </div>
            <button className="btn-rh-done" onClick={closeTradeModal}>
              View in Portfolio
            </button>
          </div>
        ) : (
          <div className="rh-trade-body">
            {/* Buy / Sell Tab */}
            <div className="rh-trade-tabs">
              <button
                className={`rh-trade-tab ${orderType === 'BUY' ? 'active buy' : ''}`}
                onClick={() => setOrderType('BUY')}
              >
                Buy {asset.symbol}
              </button>
              <button
                className={`rh-trade-tab ${orderType === 'SELL' ? 'active sell' : ''}`}
                onClick={() => setOrderType('SELL')}
              >
                Sell {asset.symbol}
              </button>
            </div>

            {/* Input Amount */}
            <div className="rh-input-group">
              <div className="rh-input-header">
                <label>Order Amount</label>
                <div className="rh-mode-toggle">
                  <span className="active">In Dollars ($)</span>
                </div>
              </div>
              <div className="rh-input-wrapper">
                <span className="currency-symbol">$</span>
                <input
                  type="number"
                  className="rh-main-input"
                  value={amountUsd}
                  onChange={e => setAmountUsd(e.target.value)}
                  placeholder="0.00"
                  min="1"
                />
              </div>
              <div className="rh-conversion-note">
                ≈ {computedShares} shares at ${assetPrice.toFixed(2)} per share
              </div>
            </div>

            {/* Quick Amount Pills */}
            <div className="rh-pills-row">
              {['50', '100', '250', '500', '1000'].map(val => (
                <button
                  key={val}
                  type="button"
                  className={`rh-pill ${amountUsd === val ? 'active' : ''}`}
                  onClick={() => setAmountUsd(val)}
                >
                  ${val}
                </button>
              ))}
            </div>

            {/* Account Details / Buying Power */}
            <div className="rh-buying-power-box">
              <div className="bp-row">
                <span className="bp-label">Robinhood Buying Power</span>
                <span className="bp-val">
                  ${buyingPower.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {existingHolding && (
                <div className="bp-row">
                  <span className="bp-label">Your Current Holdings</span>
                  <span className="bp-val">{existingHolding.shares} shares (${existingHolding.total.toFixed(2)})</span>
                </div>
              )}
            </div>

            {tradeError && (
              <div className="rh-trade-error">{tradeError}</div>
            )}

            {/* Submit Button */}
            {!connected ? (
              <button className="btn-rh-submit connect" onClick={openModal}>
                Connect Robinhood to Trade
              </button>
            ) : (
              <button
                className={`btn-rh-submit ${orderType.toLowerCase()}`}
                disabled={submitting || numericUsd <= 0}
                onClick={handleSubmitOrder}
              >
                {submitting
                  ? 'Submitting Order to Robinhood...'
                  : `${orderType === 'BUY' ? 'Buy' : 'Sell'} ${computedShares} Shares for $${numericUsd.toFixed(2)}`}
              </button>
            )}

            <div className="rh-disclaimer">
              Trades execute instantly via Robinhood Connect. Zero commission, fractional shares eligible.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
