import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';

import { env } from '../lib/env.js';
import { ensureSchema, isDbReady, pool } from '../lib/db.js';

const router = Router();

const requireDb = (_req, res) => {
  if (!isDbReady()) {
    return res.status(503).json({ error: { message: 'Database not configured' } });
  }
  return null;
};

router.post(
  '/login',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
  }),
  async (req, res) => {
    const dbErr = requireDb(req, res);
    if (dbErr) return;

    await ensureSchema();

    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: { message: 'Invalid request body' } });
    }

    const [rows] = await pool.query(
      'SELECT id, email, password_hash, role FROM admins WHERE email = ? LIMIT 1',
      [email.toLowerCase()],
    );
    const admin = rows?.[0];
    if (!admin) {
      return res.status(401).json({ error: { message: 'Invalid email or password' } });
    }

    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) {
      return res.status(401).json({ error: { message: 'Invalid email or password' } });
    }

    const accessToken = jwt.sign(
      { sub: admin.id, role: admin.role },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN, algorithm: 'HS256' },
    );

    // Refresh token: store only a hash in DB.
    const refreshTokenRaw = crypto.randomBytes(32).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(refreshTokenRaw).digest('hex');
    const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);

    await pool.query(
      'INSERT INTO refresh_tokens (admin_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [admin.id, refreshTokenHash, expiresAt],
    );

    res.cookie(env.REFRESH_TOKEN_COOKIE_NAME, refreshTokenRaw, {
      httpOnly: true,
      secure: env.REFRESH_COOKIE_SECURE,
      sameSite: env.REFRESH_COOKIE_SAMESITE,
      path: '/api/v1/auth',
      expires: expiresAt,
    });

    return res.json({ accessToken, tokenType: 'Bearer', admin: { email: admin.email, role: admin.role } });
  },
);

router.post('/refresh', async (req, res) => {
  const dbErr = requireDb(req, res);
  if (dbErr) return;

  await ensureSchema();

  const refreshRaw = req.cookies?.[env.REFRESH_TOKEN_COOKIE_NAME];
  if (typeof refreshRaw !== 'string' || !refreshRaw) {
    return res.status(401).json({ error: { message: 'Missing refresh token' } });
  }

  const refreshHash = crypto.createHash('sha256').update(refreshRaw).digest('hex');

  const [rows] = await pool.query(
    `
    SELECT rt.id, rt.admin_id, rt.expires_at, rt.revoked_at, a.role
    FROM refresh_tokens rt
    JOIN admins a ON a.id = rt.admin_id
    WHERE rt.token_hash = ?
    LIMIT 1
    `,
    [refreshHash],
  );
  const tokenRow = rows?.[0];
  if (!tokenRow || tokenRow.revoked_at || new Date(tokenRow.expires_at).getTime() < Date.now()) {
    res.clearCookie(env.REFRESH_TOKEN_COOKIE_NAME, { path: '/api/v1/auth' });
    return res.status(401).json({ error: { message: 'Invalid refresh token' } });
  }

  // Rotate refresh token.
  const refreshTokenRaw = crypto.randomBytes(32).toString('hex');
  const refreshTokenHash = crypto.createHash('sha256').update(refreshTokenRaw).digest('hex');
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);

  await pool.query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = ?', [tokenRow.id]);
  await pool.query(
    'INSERT INTO refresh_tokens (admin_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [tokenRow.admin_id, refreshTokenHash, expiresAt],
  );

  const accessToken = jwt.sign(
    { sub: tokenRow.admin_id, role: tokenRow.role },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN, algorithm: 'HS256' },
  );

  res.cookie(env.REFRESH_TOKEN_COOKIE_NAME, refreshTokenRaw, {
    httpOnly: true,
    secure: env.REFRESH_COOKIE_SECURE,
    sameSite: env.REFRESH_COOKIE_SAMESITE,
    path: '/api/v1/auth',
    expires: expiresAt,
  });

  return res.json({ accessToken, tokenType: 'Bearer' });
});

router.post('/logout', async (req, res) => {
  const dbErr = requireDb(req, res);
  if (dbErr) return;

  await ensureSchema();

  const refreshRaw = req.cookies?.[env.REFRESH_TOKEN_COOKIE_NAME];
  if (typeof refreshRaw === 'string' && refreshRaw) {
    const refreshHash = crypto.createHash('sha256').update(refreshRaw).digest('hex');
    await pool.query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ?', [refreshHash]);
  }

  res.clearCookie(env.REFRESH_TOKEN_COOKIE_NAME, { path: '/api/v1/auth' });
  return res.json({ ok: true });
});

export default router;

