import express from 'express';
import cors from 'cors';
import tokensRouter from './routes/tokens.mjs';
import robinhoodRouter from './routes/robinhood.mjs';
import stocksRouter from './routes/stocks.mjs';
import desksRouter from './routes/desks.mjs';
import analyticsRouter from './routes/analytics.mjs';
import chainRouter from './routes/chain.mjs';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Rexi Robinhood Backend API',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/tokens', tokensRouter);
app.use('/api/robinhood', robinhoodRouter);
app.use('/api/stocks', stocksRouter);
app.use('/api/desks', desksRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/chain', chainRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Rexi Backend running on http://localhost:${PORT}`);
    console.log(`📊 Health check available at http://localhost:${PORT}/api/health`);
  });
}

export default app;
