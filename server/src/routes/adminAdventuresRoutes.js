import { Router } from 'express';

import { ensureSchema, isDbReady, pool } from '../lib/db.js';
import { requireAdminJwt } from '../middleware/adminAuth.js';

const router = Router();
router.use(requireAdminJwt);

function toBool(value) {
  if (value === true || value === 1 || value === '1') return 1;
  return 0;
}

router.get('/', async (req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();

  const limit = Math.min(Number(req.query.limit ?? 50), 100);
  const [rows] = await pool.query(
    'SELECT id, slug, title, subtitle, hero_image_url AS heroImageUrl, related_package_id AS relatedPackageId, publish, updated_at FROM adventures ORDER BY updated_at DESC LIMIT ?',
    [limit],
  );
  return res.json({ adventures: rows });
});

router.get('/:id', async (req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();

  const adventureId = Number(req.params.id);
  if (!Number.isFinite(adventureId)) return res.status(400).json({ error: { message: 'Invalid id' } });

  const [rows] = await pool.query(
    `
    SELECT
      id,
      slug,
      title,
      subtitle,
      description,
      hero_image_url AS heroImageUrl,
      related_package_id AS relatedPackageId,
      publish
    FROM adventures
    WHERE id = ?
    LIMIT 1
    `,
    [adventureId],
  );

  const adventure = rows?.[0];
  if (!adventure) return res.status(404).json({ error: { message: 'Adventure not found' } });
  return res.json({ adventure });
});

router.post('/', async (req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();

  const body = req.body ?? {};
  const slug = body.slug;
  const title = body.title;
  if (typeof slug !== 'string' || typeof title !== 'string') {
    return res.status(400).json({ error: { message: 'slug and title are required' } });
  }

  const publish = toBool(body.publish);
  const relatedPackageId = body.relatedPackageId == null ? null : Number(body.relatedPackageId);

  const [result] = await pool.query(
    `
    INSERT INTO adventures (slug, title, subtitle, description, hero_image_url, publish, related_package_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      slug,
      title,
      typeof body.subtitle === 'string' ? body.subtitle : null,
      typeof body.description === 'string' ? body.description : null,
      typeof body.heroImageUrl === 'string' ? body.heroImageUrl : null,
      publish,
      Number.isFinite(relatedPackageId) ? relatedPackageId : null,
    ],
  );

  return res.status(201).json({ ok: true, id: result.insertId });
});

router.put('/:id', async (req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();

  const adventureId = Number(req.params.id);
  if (!Number.isFinite(adventureId)) return res.status(400).json({ error: { message: 'Invalid id' } });

  const body = req.body ?? {};
  const slug = typeof body.slug === 'string' ? body.slug : null;
  const title = typeof body.title === 'string' ? body.title : null;
  if (!slug || !title) return res.status(400).json({ error: { message: 'slug and title are required' } });

  const publish = toBool(body.publish);
  const relatedPackageId = body.relatedPackageId == null ? null : Number(body.relatedPackageId);

  await pool.query(
    `
    UPDATE adventures SET
      slug = ?,
      title = ?,
      subtitle = ?,
      description = ?,
      hero_image_url = ?,
      publish = ?,
      related_package_id = ?
    WHERE id = ?
    `,
    [
      slug,
      title,
      typeof body.subtitle === 'string' ? body.subtitle : null,
      typeof body.description === 'string' ? body.description : null,
      typeof body.heroImageUrl === 'string' ? body.heroImageUrl : null,
      publish,
      Number.isFinite(relatedPackageId) ? relatedPackageId : null,
      adventureId,
    ],
  );

  return res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();

  const adventureId = Number(req.params.id);
  if (!Number.isFinite(adventureId)) return res.status(400).json({ error: { message: 'Invalid id' } });

  await pool.query('DELETE FROM adventures WHERE id = ? LIMIT 1', [adventureId]);
  return res.json({ ok: true });
});

export default router;

