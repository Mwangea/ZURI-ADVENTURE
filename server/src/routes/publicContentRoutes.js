import { Router } from 'express';

import { ensureSchema, isDbReady, pool } from '../lib/db.js';
import { getSeoRevision, setPublicDetailSeoHeaders } from '../lib/seoCache.js';

const router = Router();

router.get('/seo-revision', (_req, res) => {
  return res.json({ revision: getSeoRevision() });
});

router.get('/hero', async (_req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();
  const [rows] = await pool.query(
    'SELECT * FROM content_hero WHERE id = 1 AND publish = 1 LIMIT 1',
  );
  return res.json({ hero: rows?.[0] ?? null });
});

router.get('/testimonials', async (_req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();
  const [rows] = await pool.query(
    'SELECT * FROM content_testimonials WHERE publish = 1 ORDER BY sort_order ASC, id ASC',
  );
  return res.json({ testimonials: rows });
});

router.get('/promo-banner', async (_req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();
  const [rows] = await pool.query(
    `
    SELECT *
    FROM content_promo_banner
    WHERE id = 1
      AND enabled = 1
      AND (start_at IS NULL OR start_at <= NOW())
      AND (end_at IS NULL OR end_at >= NOW())
    LIMIT 1
    `,
  );
  return res.json({ banner: rows?.[0] ?? null });
});

router.get('/policies', async (_req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();
  setPublicDetailSeoHeaders(res);
  const [rows] = await pool.query(
    'SELECT id, type, slug, title, body FROM content_policies WHERE publish = 1 ORDER BY id ASC',
  );
  return res.json({ policies: rows });
});

router.get('/policies/:slug', async (req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();
  const slug = String(req.params.slug ?? '').trim();
  const [rows] = await pool.query(
    'SELECT id, type, slug, title, body FROM content_policies WHERE slug = ? AND publish = 1 LIMIT 1',
    [slug],
  );
  const policy = rows?.[0];
  if (!policy) return res.status(404).json({ error: { message: 'Policy not found' } });
  setPublicDetailSeoHeaders(res);
  return res.json({ policy });
});

router.get('/gallery', async (_req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();
  const [rows] = await pool.query(
    'SELECT * FROM content_gallery_media WHERE publish = 1 ORDER BY sort_order ASC, id ASC',
  );
  return res.json({ media: rows });
});

router.get('/home', async (_req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();

  setPublicDetailSeoHeaders(res);

  const [heroRows] = await pool.query('SELECT * FROM content_hero WHERE id = 1 AND publish = 1 LIMIT 1');
  const [testimonialRows] = await pool.query(
    'SELECT * FROM content_testimonials WHERE publish = 1 ORDER BY sort_order ASC, id ASC',
  );
  const [bannerRows] = await pool.query(
    `
    SELECT *
    FROM content_promo_banner
    WHERE id = 1
      AND enabled = 1
      AND (start_at IS NULL OR start_at <= NOW())
      AND (end_at IS NULL OR end_at >= NOW())
    LIMIT 1
    `,
  );
  const [galleryRows] = await pool.query(
    'SELECT * FROM content_gallery_media WHERE publish = 1 ORDER BY sort_order ASC, id ASC',
  );

  return res.json({
    hero: heroRows?.[0] ?? null,
    testimonials: testimonialRows ?? [],
    promoBanner: bannerRows?.[0] ?? null,
    gallery: galleryRows ?? [],
  });
});

export default router;
