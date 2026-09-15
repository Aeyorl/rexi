import { Router } from 'express';
import { db } from '../db.mjs';

const router = Router();

// GET /api/stocks - list tokenized stock prices and yields
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: db.data.stocks
  });
});

// GET /api/stocks/:symbol - single stock quote
router.get('/:symbol', (req, res) => {
  const { symbol } = req.params;
  const stock = db.data.stocks.find(s => s.symbol.toLowerCase() === symbol.toLowerCase());
  if (!stock) {
    return res.status(404).json({ success: false, error: 'Stock asset not found' });
  }
  res.json({ success: true, data: stock });
});

// GET /api/rewards - global rewards stats
router.get('/meta/rewards', (req, res) => {
  res.json({
    success: true,
    data: {
      totalDistributed: '$1,740,250',
      distributions: '11,489',
      payingTokens: '210',
      holderPayouts: '38,410'
    }
  });
});

// POST /api/rewards/claim - claim dividends
router.post('/meta/claim', (req, res) => {
  res.json({
    success: true,
    message: 'Dividends claimed successfully from all held tokenized stocks.',
    claimedAmountUsd: 142.80,
    txHash: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`
  });
});

export default router;
