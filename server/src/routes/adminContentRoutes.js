import { Router } from 'express';

import { ensureSchema, isDbReady, pool } from '../lib/db.js';
import { bumpSeoRevision } from '../lib/seoCache.js';
import { requireAdminJwt } from '../middleware/adminAuth.js';

const router = Router();
router.use(requireAdminJwt);

function toBool(v) {
  return v === true || v === 1 || v === '1' ? 1 : 0;
}

router.get('/hero', async (_req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();
  const [rows] = await pool.query('SELECT * FROM content_hero WHERE id = 1 LIMIT 1');
  return res.json({ hero: rows?.[0] ?? null });
});

router.put('/hero', async (req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();
  const body = req.body ?? {};
  await pool.query(
    `
    INSERT INTO content_hero
      (id, title, subtitle, cta_label, cta_link, background_image_url, publish)
    VALUES
      (1, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      title = VALUES(title),
      subtitle = VALUES(subtitle),
      cta_label = VALUES(cta_label),
      cta_link = VALUES(cta_link),
      background_image_url = VALUES(background_image_url),
      publish = VALUES(publish)
    `,
    [
      typeof body.title === 'string' ? body.title : 'Zuri Adventures',
      typeof body.subtitle === 'string' ? body.subtitle : null,
      typeof body.ctaLabel === 'string' ? body.ctaLabel : null,
      typeof body.ctaLink === 'string' ? body.ctaLink : null,
      typeof body.backgroundImageUrl === 'string' ? body.backgroundImageUrl : null,
      toBool(body.publish),
    ],
  );
  bumpSeoRevision();
  return res.json({ ok: true });
});

router.get('/testimonials', async (_req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();
  const [rows] = await pool.query('SELECT * FROM content_testimonials ORDER BY sort_order ASC, id ASC');
  return res.json({ testimonials: rows });
});

router.post('/testimonials', async (req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();
  const body = req.body ?? {};
  if (typeof body.quote !== 'string' || typeof body.authorName !== 'string') {
    return res.status(400).json({ error: { message: 'quote and authorName are required' } });
  }
  const [result] = await pool.query(
    `
    INSERT INTO content_testimonials
      (quote, author_name, location, avatar_url, rating, trip_label, publish, sort_order)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      body.quote,
      body.authorName,
      typeof body.location === 'string' ? body.location : null,
      typeof body.avatarUrl === 'string' ? body.avatarUrl : null,
      body.rating == null ? null : Number(body.rating),
      typeof body.tripLabel === 'string' ? body.tripLabel : null,
      toBool(body.publish ?? 1),
      Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
    ],
  );
  bumpSeoRevision();
  return res.status(201).json({ ok: true, id: result.insertId });
});

router.put('/testimonials/:id', async (req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: { message: 'Invalid id' } });
  const body = req.body ?? {};
  await pool.query(
    `
    UPDATE content_testimonials
    SET quote = ?, author_name = ?, location = ?, avatar_url = ?, rating = ?, trip_label = ?, publish = ?, sort_order = ?
    WHERE id = ?
    `,
    [
      typeof body.quote === 'string' ? body.quote : '',
      typeof body.authorName === 'string' ? body.authorName : '',
      typeof body.location === 'string' ? body.location : null,
      typeof body.avatarUrl === 'string' ? body.avatarUrl : null,
      body.rating == null ? null : Number(body.rating),
      typeof body.tripLabel === 'string' ? body.tripLabel : null,
      toBool(body.publish),
      Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
      id,
    ],
  );
  bumpSeoRevision();
  return res.json({ ok: true });
});

router.post('/testimonials/reorder', async (req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  for (let i = 0; i < items.length; i += 1) {
    const id = Number(items[i]?.id);
    if (!Number.isFinite(id)) continue;
    await pool.query('UPDATE content_testimonials SET sort_order = ? WHERE id = ?', [i, id]);
  }
  bumpSeoRevision();
  return res.json({ ok: true });
});

router.delete('/testimonials/:id', async (req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: { message: 'Invalid id' } });
  await pool.query('DELETE FROM content_testimonials WHERE id = ?', [id]);
  bumpSeoRevision();
  return res.json({ ok: true });
});

router.get('/promo-banner', async (_req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();
  const [rows] = await pool.query('SELECT * FROM content_promo_banner WHERE id = 1 LIMIT 1');
  return res.json({ banner: rows?.[0] ?? null });
});

router.put('/promo-banner', async (req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();
  const body = req.body ?? {};
  await pool.query(
    `
    INSERT INTO content_promo_banner
      (id, enabled, message, image_url, cta_label, cta_link, start_at, end_at)
    VALUES
      (1, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      enabled = VALUES(enabled),
      message = VALUES(message),
      image_url = VALUES(image_url),
      cta_label = VALUES(cta_label),
      cta_link = VALUES(cta_link),
      start_at = VALUES(start_at),
      end_at = VALUES(end_at)
    `,
    [
      toBool(body.enabled),
      typeof body.message === 'string' ? body.message : null,
      typeof body.imageUrl === 'string' ? body.imageUrl : null,
      typeof body.ctaLabel === 'string' ? body.ctaLabel : null,
      typeof body.ctaLink === 'string' ? body.ctaLink : null,
      typeof body.startAt === 'string' ? body.startAt : null,
      typeof body.endAt === 'string' ? body.endAt : null,
    ],
  );
  bumpSeoRevision();
  return res.json({ ok: true });
});

router.get('/policies', async (_req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();
  const [rows] = await pool.query('SELECT * FROM content_policies ORDER BY id ASC');
  return res.json({ policies: rows });
});

router.post('/policies', async (req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();
  const body = req.body ?? {};
  if (typeof body.type !== 'string' || typeof body.slug !== 'string' || typeof body.title !== 'string') {
    return res.status(400).json({ error: { message: 'type, slug and title are required' } });
  }
  const [result] = await pool.query(
    `
    INSERT INTO content_policies (type, slug, title, body, publish)
    VALUES (?, ?, ?, ?, ?)
    `,
    [body.type, body.slug, body.title, typeof body.body === 'string' ? body.body : '', toBool(body.publish ?? 1)],
  );
  bumpSeoRevision();
  return res.status(201).json({ ok: true, id: result.insertId });
});

router.put('/policies/:id', async (req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: { message: 'Invalid id' } });
  const body = req.body ?? {};
  await pool.query(
    `
    UPDATE content_policies
    SET type = ?, slug = ?, title = ?, body = ?, publish = ?
    WHERE id = ?
    `,
    [
      typeof body.type === 'string' ? body.type : 'TERMS',
      typeof body.slug === 'string' ? body.slug : '',
      typeof body.title === 'string' ? body.title : '',
      typeof body.body === 'string' ? body.body : '',
      toBool(body.publish),
      id,
    ],
  );
  bumpSeoRevision();
  return res.json({ ok: true });
});

router.delete('/policies/:id', async (req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: { message: 'Invalid id' } });
  await pool.query('DELETE FROM content_policies WHERE id = ?', [id]);
  bumpSeoRevision();
  return res.json({ ok: true });
});

router.get('/gallery', async (_req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();
  const [rows] = await pool.query('SELECT * FROM content_gallery_media ORDER BY sort_order ASC, id ASC');
  return res.json({ media: rows });
});

router.post('/gallery', async (req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();
  const body = req.body ?? {};
  const [result] = await pool.query(
    `
    INSERT INTO content_gallery_media
      (media_type, src_url, video_embed_url, title, caption, section_key, publish, sort_order)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      body.mediaType === 'VIDEO' ? 'VIDEO' : 'IMAGE',
      typeof body.srcUrl === 'string' ? body.srcUrl : null,
      typeof body.videoEmbedUrl === 'string' ? body.videoEmbedUrl : null,
      typeof body.title === 'string' ? body.title : null,
      typeof body.caption === 'string' ? body.caption : null,
      typeof body.sectionKey === 'string' ? body.sectionKey : null,
      toBool(body.publish ?? 1),
      Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
    ],
  );
  bumpSeoRevision();
  return res.status(201).json({ ok: true, id: result.insertId });
});

router.put('/gallery/:id', async (req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: { message: 'Invalid id' } });
  const body = req.body ?? {};
  await pool.query(
    `
    UPDATE content_gallery_media
    SET media_type = ?, src_url = ?, video_embed_url = ?, title = ?, caption = ?, section_key = ?, publish = ?, sort_order = ?
    WHERE id = ?
    `,
    [
      body.mediaType === 'VIDEO' ? 'VIDEO' : 'IMAGE',
      typeof body.srcUrl === 'string' ? body.srcUrl : null,
      typeof body.videoEmbedUrl === 'string' ? body.videoEmbedUrl : null,
      typeof body.title === 'string' ? body.title : null,
      typeof body.caption === 'string' ? body.caption : null,
      typeof body.sectionKey === 'string' ? body.sectionKey : null,
      toBool(body.publish),
      Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
      id,
    ],
  );
  bumpSeoRevision();
  return res.json({ ok: true });
});

router.post('/gallery/reorder', async (req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  for (let i = 0; i < items.length; i += 1) {
    const id = Number(items[i]?.id);
    if (!Number.isFinite(id)) continue;
    await pool.query('UPDATE content_gallery_media SET sort_order = ? WHERE id = ?', [i, id]);
  }
  bumpSeoRevision();
  return res.json({ ok: true });
});

router.delete('/gallery/:id', async (req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: { message: 'Invalid id' } });
  await pool.query('DELETE FROM content_gallery_media WHERE id = ?', [id]);
  bumpSeoRevision();
  return res.json({ ok: true });
});

export default router;
