import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import apiV1Router from './routes/apiV1.js';
import { ensureSchema } from './lib/db.js';
import { bootstrapAdminIfConfigured } from './lib/bootstrapAdmin.js';

export function createApp() {
  const app = express();

  // Security headers (safe defaults). Content-Security-Policy disabled for now
  // because the frontend may use inline styles/stylesheets that require tuning.
  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );

  app.disable('x-powered-by');

  // Basic request protection
  app.use(
    express.json({
      limit: '1mb',
    }),
  );
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());

  // Same-origin-friendly CORS for local development.
  // In production (same domain), CORS can be very restrictive.
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true); // non-browser requests
        const allowedOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
        if (origin === allowedOrigin) return cb(null, true);
        return cb(null, origin === process.env.CORS_ORIGIN);
      },
      credentials: false,
    }),
  );

  // Minimal request logging (development only)
  app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'production') return next();
    const start = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - start;
      // eslint-disable-next-line no-console
      console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms}ms)`);
    });
    next();
  });

  // Health + API shell
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      uptimeSeconds: process.uptime(),
      service: 'zuri-adventures-api',
    });
  });

  // If MySQL is configured, initialize schema on startup (best-effort).
  ensureSchema().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[server] ensureSchema failed:', err);
  });

  bootstrapAdminIfConfigured().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[server] bootstrapAdminIfConfigured failed:', err);
  });

  app.use('/api/v1', apiV1Router);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      error: {
        message: 'Not found',
      },
    });
  });

  // Error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    const status = Number.isInteger(err?.status) ? err.status : 500;
    res.status(status).json({
      error: {
        message: err?.message ?? 'Internal server error',
      },
    });
  });

  return app;
}

