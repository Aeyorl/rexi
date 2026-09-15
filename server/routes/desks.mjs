import { Router } from 'express';
import { db } from '../db.mjs';

const router = Router();

// GET /api/desks
router.get('/', (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const p = parseInt(page);
  const l = parseInt(limit);

  // Generate desk rows
  const allDesks = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    name: `OTC Desk #${i + 1}`,
    earned: (120.50 + i * 42.15).toFixed(2)
  }));

  const paged = allDesks.slice((p - 1) * l, p * l);

  res.json({
    success: true,
    meta: db.data.desks,
    pagination: {
      total: allDesks.length,
      page: p,
      limit: l,
      totalPages: Math.ceil(allDesks.length / l)
    },
    data: paged
  });
});

export default router;
