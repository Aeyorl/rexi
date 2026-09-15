import app from '../server/index.mjs';

export default function handler(req, res) {
  // Vercel strips `/api` before invoking this function; restore it for Express.
  if (!req.url.startsWith('/api')) req.url = `/api${req.url}`;
  return app(req, res);
}
