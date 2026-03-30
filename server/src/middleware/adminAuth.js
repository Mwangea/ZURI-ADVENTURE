import jwt from 'jsonwebtoken';
import { env } from '../lib/env.js';

export function requireAdminJwt(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: { message: 'Missing Authorization header' } });
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],
    });

    if (!payload || payload.role !== 'admin' || !payload.sub) {
      return res.status(403).json({ error: { message: 'Forbidden' } });
    }

    req.admin = { id: payload.sub, role: payload.role };
    return next();
  } catch (_err) {
    return res.status(401).json({ error: { message: 'Invalid or expired token' } });
  }
}

