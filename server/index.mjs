if (typeof process.loadEnvFile === 'function') {
  try { process.loadEnvFile(); } catch (_) {}
}

import express from 'express';
import cors from 'cors';
import chainRouter from './routes/chain.mjs';
import { startBackgroundSync, stopBackgroundSync, getSyncStatus } from './indexer.mjs';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (!req.originalUrl.includes('/sync-status')) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} (${Date.now() - start}ms)`);
    }
  });
  next();
});

// Health Check
app.get('/api/health', (_req, res) => {
  const sync = getSyncStatus();
  res.json({
    status: 'ok',
    service: 'Bool Robinhood Backend API',
    network: sync.network,
    chainId: sync.chainId,
    launchpad: sync.launchpad,
    lastSyncedBlock: sync.lastSyncedBlock,
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/chain', chainRouter);

// Serve frontend static bundle if built (e.g. Docker / standalone production)
import path from 'node:path';
import fs from 'node:fs';
const distPath = path.resolve('dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// 404 Handler for API
app.use('/api', (req, res) => {
  res.status(404).json({ error: `API Route ${req.originalUrl} not found` });
});

let serverInstance = null;

if (process.env.VERCEL !== '1') {
  serverInstance = app.listen(PORT, () => {
    const status = getSyncStatus();
    console.log(`🚀 Bool Backend running on http://localhost:${PORT}`);
    console.log(`🌐 Active Network: ${status.network.toUpperCase()} (Chain ID ${status.chainId})`);
    console.log(`📍 Launchpad Address: ${status.launchpad || 'Not configured'}`);
    console.log(`📊 Health check available at http://localhost:${PORT}/api/health`);
    
    // Start continuous background indexing
    startBackgroundSync();
  });

  const shutdown = () => {
    console.log('\n[Server] Shutting down gracefully...');
    stopBackgroundSync();
    if (serverInstance) {
      serverInstance.close(() => {
        console.log('[Server] HTTP service stopped.');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

export default app;
