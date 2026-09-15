import { Router } from 'express';
import { db } from '../db.mjs';

const router = Router();

// GET /api/robinhood/account
router.get('/account', (req, res) => {
  const rh = db.data.robinhood;
  const totalHoldingsValue = rh.holdings.reduce((sum, h) => sum + (h.shares * h.price), 0);
  const totalAccountValue = rh.buyingPower + totalHoldingsValue;

  res.json({
    success: true,
    data: {
      accountNumber: rh.accountNumber,
      walletName: rh.walletName,
      buyingPower: rh.buyingPower,
      totalHoldingsValue: +totalHoldingsValue.toFixed(2),
      totalAccountValue: +totalAccountValue.toFixed(2),
      holdings: rh.holdings
    }
  });
});

// POST /api/robinhood/orders - place buy/sell order
router.post('/orders', (req, res) => {
  const { symbol, name, price, action, amountUsd, sharesCount } = req.body;

  if (!symbol || !action || !amountUsd || !sharesCount) {
    return res.status(400).json({ success: false, error: 'Missing order parameters.' });
  }

  const rh = db.data.robinhood;
  const parsedAmount = parseFloat(amountUsd);
  const parsedShares = parseFloat(sharesCount);
  const parsedPrice = parseFloat(price) || 100;

  if (action === 'BUY') {
    if (parsedAmount > rh.buyingPower) {
      return res.status(400).json({ success: false, error: 'Insufficient Robinhood buying power.' });
    }
    rh.buyingPower = +(rh.buyingPower - parsedAmount).toFixed(2);

    const existing = rh.holdings.find(h => h.symbol === symbol);
    if (existing) {
      existing.shares = +(existing.shares + parsedShares).toFixed(4);
      existing.total = +(existing.shares * parsedPrice).toFixed(2);
    } else {
      rh.holdings.push({
        symbol,
        name: name || symbol,
        shares: +parsedShares.toFixed(4),
        price: parsedPrice,
        total: +parsedAmount.toFixed(2)
      });
    }
  } else if (action === 'SELL') {
    const existing = rh.holdings.find(h => h.symbol === symbol);
    if (!existing || existing.shares < parsedShares) {
      return res.status(400).json({ success: false, error: `You do not own enough shares of ${symbol}.` });
    }

    rh.buyingPower = +(rh.buyingPower + parsedAmount).toFixed(2);
    existing.shares = +(existing.shares - parsedShares).toFixed(4);
    existing.total = +(existing.shares * parsedPrice).toFixed(2);

    // Remove if 0
    if (existing.shares <= 0) {
      rh.holdings = rh.holdings.filter(h => h.symbol !== symbol);
    }
  }

  const orderRecord = {
    id: `ORD-${Date.now()}`,
    symbol,
    action,
    shares: parsedShares,
    amountUsd: parsedAmount,
    price: parsedPrice,
    timestamp: Date.now(),
    status: 'FILLED'
  };

  rh.orders.unshift(orderRecord);
  db.save();

  res.status(201).json({
    success: true,
    message: `Successfully executed ${action} order for ${parsedShares} shares of ${symbol}.`,
    order: orderRecord,
    updatedAccount: {
      buyingPower: rh.buyingPower,
      holdings: rh.holdings
    }
  });
});

// POST /api/robinhood/deposit - fund cash from Robinhood Checking / Brokerage
router.post('/deposit', (req, res) => {
  const { amount } = req.body;
  const num = parseFloat(amount);
  if (!num || num <= 0) {
    return res.status(400).json({ success: false, error: 'Valid deposit amount required.' });
  }

  const rh = db.data.robinhood;
  rh.buyingPower = +(rh.buyingPower + num).toFixed(2);
  db.save();

  res.json({
    success: true,
    message: `$${num.toFixed(2)} deposited via Robinhood Connect.`,
    buyingPower: rh.buyingPower
  });
});

// GET /api/robinhood/orders - order history
router.get('/orders', (req, res) => {
  res.json({
    success: true,
    data: db.data.robinhood.orders
  });
});

export default router;
