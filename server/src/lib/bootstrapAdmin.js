import bcrypt from 'bcryptjs';

import { env } from './env.js';
import { ensureSchema, isDbReady, pool } from './db.js';

export async function bootstrapAdminIfConfigured() {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL;
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (typeof email !== 'string' || typeof password !== 'string') return;
  if (!isDbReady()) return;

  await ensureSchema();

  const [rows] = await pool.query('SELECT id FROM admins WHERE email = ? LIMIT 1', [email.toLowerCase()]);
  if (rows?.length) return;

  const passwordHash = await bcrypt.hash(password, 12);
  await pool.query(
    'INSERT INTO admins (email, password_hash, role) VALUES (?, ?, ?)',
    [email.toLowerCase(), passwordHash, 'admin'],
  );
}

