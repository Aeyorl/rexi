import { Router } from 'express';
import {
  syncCycle,
  getLaunchesIndex,
  getLaunchDetail,
  getChainActivity,
  getChainHealth,
  getSyncStatus
} from '../indexer.mjs';

const router = Router();

// Middleware to ensure initial sync is populated if ready
async function ensureSynced(_req, _res, next) {
  const status = getSyncStatus();
  if (!status.lastSyncedBlock && !status.isSyncing) {
    try {
      await syncCycle();
    } catch (e) {
      console.warn('[ChainRouter] Initial sync attempt error:', e.message);
    }
  }
  next();
}

router.use(ensureSynced);

/**
 * GET /api/chain/launches
 * Full catalog of launches, aggregate stats, and recent distributions.
 */
router.get('/launches', async (_req, res) => {
  try {
    const index = getLaunchesIndex();
    res.json(index);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal indexing error', detail: error.message });
  }
});

/**
 * GET /api/chain/launches/:token
 * Single launch detail with token-specific distribution history.
 */
router.get('/launches/:token', async (req, res) => {
  try {
    const detail = getLaunchDetail(req.params.token);
    if (!detail) {
      return res.status(404).json({ success: false, error: 'Launch not found on current launchpad' });
    }
    res.json(detail);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal indexing error', detail: error.message });
  }
});

/**
 * GET /api/chain/activity
 * Live finance ledger: cumulative fee split, daily buckets, treasury balances.
 */
router.get('/activity', async (_req, res) => {
  try {
    const activity = getChainActivity();
    if (!activity) {
      return res.status(503).json({ success: false, error: 'Indexer initializing. Retry shortly.' });
    }
    res.json(activity);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal indexing error', detail: error.message });
  }
});

/**
 * GET /api/chain/health
 * Invariant solvency audit: checks for bucket drift and asset backing.
 */
router.get('/health', async (_req, res) => {
  try {
    const health = getChainHealth();
    if (!health) {
      return res.status(503).json({ success: false, status: 'initializing', error: 'Indexer initializing' });
    }
    res.status(health.status === 'ok' ? 200 : 503).json(health);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal indexing error', detail: error.message });
  }
});

/**
 * GET /api/chain/sync-status
 * Health, block height, and network mode of the background indexer.
 */
router.get('/sync-status', async (_req, res) => {
  try {
    res.json({
      success: true,
      status: getSyncStatus()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/chain/sync
 * Manually trigger an indexer sync cycle.
 */
router.post('/sync', async (_req, res) => {
  try {
    await syncCycle();
    res.json({ success: true, status: getSyncStatus() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;