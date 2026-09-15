import { Router } from 'express';
import { db } from '../db.mjs';

const router = Router();

// GET /api/analytics
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: db.data.analytics
  });
});

export default router;
