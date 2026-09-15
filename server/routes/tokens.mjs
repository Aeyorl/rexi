import { Router } from 'express';
import { db } from '../db.mjs';

const router = Router();

// GET /api/tokens - list all tokens with search and sort
router.get('/', (req, res) => {
  const { search = '', sort = 'FDV' } = req.query;
  let tokens = [...db.data.tokens];

  // Search filter
  if (search.trim()) {
    const q = search.toLowerCase();
    tokens = tokens.filter(t => 
      t.symbol.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.pays.toLowerCase().includes(q)
    );
  }

  // Sorting
  if (sort === 'FDV') {
    tokens.sort((a, b) => b.fdvNum - a.fdvNum);
  } else if (sort === 'Recent') {
    tokens.sort((a, b) => b.createdAt - a.createdAt);
  } else if (sort === '24h volume') {
    tokens.sort((a, b) => b.volume24h - a.volume24h);
  }

  res.json({
    success: true,
    count: tokens.length,
    data: tokens
  });
});

// GET /api/tokens/:id - get single token
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const token = db.data.tokens.find(t => t.id === id || t.symbol.toLowerCase() === id.toLowerCase());
  if (!token) {
    return res.status(404).json({ success: false, error: 'Token not found' });
  }
  res.json({ success: true, data: token });
});

// POST /api/tokens/launch - launch a new token
router.post('/launch', (req, res) => {
  const { name, symbol, description, pair, firstBuyUsd } = req.body;

  if (!name || !symbol) {
    return res.status(400).json({ success: false, error: 'Name and symbol are required.' });
  }

  const cleanSymbol = symbol.startsWith('$') ? symbol : `$${symbol.toUpperCase()}`;

  const paysMap = {
    'AAPLx': '🍎',
    'TSLAx': '⚡',
    'NVDAx': '🟢',
    'HOODx': '🏹',
    'SPACEX': '🚀',
    'NEURALINK': '🧠'
  };

  const newToken = {
    id: String(Date.now()),
    symbol: cleanSymbol,
    name,
    description: description || '',
    badge: 'p/1',
    fdv: '$125K',
    fdvNum: 125000,
    pays: pair || 'AAPLx',
    paysIcon: paysMap[pair] || '💎',
    volume24h: 15000,
    createdAt: Date.now(),
    trend: [10, 14, 18, 22, 35, 48, 55, 70, 85],
    platform: 'rexi-robinhood',
    firstBuyUsd: Number(firstBuyUsd) || 0
  };

  db.data.tokens.unshift(newToken);
  db.save();

  res.status(201).json({
    success: true,
    message: `${cleanSymbol} successfully launched on Rexi via Robinhood`,
    data: newToken
  });
});

export default router;
