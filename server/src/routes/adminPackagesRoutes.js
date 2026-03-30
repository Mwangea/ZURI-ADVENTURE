import { Router } from 'express';
import crypto from 'crypto';

import { ensureSchema, isDbReady, pool } from '../lib/db.js';
import { requireAdminJwt } from '../middleware/adminAuth.js';

const router = Router();
router.use(requireAdminJwt);

function toInt(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function toBool(value) {
  if (value === true || value === 1 || value === '1') return 1;
  return 0;
}

router.get('/', async (req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();

  const limit = Math.min(Number(req.query.limit ?? 50), 100);
  const [rows] = await pool.query(
    'SELECT id, slug, name, duration, featured, publish, updated_at FROM packages ORDER BY updated_at DESC LIMIT ?',
    [limit],
  );

  return res.json({
    packages: rows,
  });
});

router.post('/', async (req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();

  const body = req.body ?? {};

  const slug = body.slug;
  const name = body.name;
  if (typeof slug !== 'string' || typeof name !== 'string') {
    return res.status(400).json({ error: { message: 'slug and name are required' } });
  }

  const featured = toBool(body.featured);
  const publish = toBool(body.publish);

  const [result] = await pool.query(
    `
    INSERT INTO packages
      (slug, name, duration, tourType, maxPeople, minAge, scheduling_mode, overview, seoDescription, price_base, price_note, tour_map_url, featured, publish, hero_image_url)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      slug,
      name,
      typeof body.duration === 'string' ? body.duration : '',
      typeof body.tourType === 'string' ? body.tourType : null,
      toInt(body.maxPeople),
      toInt(body.minAge),
      body.schedulingMode === 'FLEXIBLE_DATES' ? 'FLEXIBLE_DATES' : 'FIXED_DEPARTURES',
      typeof body.overview === 'string' ? body.overview : null,
      typeof body.seoDescription === 'string' ? body.seoDescription : null,
      body.priceBase == null ? null : Number(body.priceBase),
      typeof body.priceNote === 'string' ? body.priceNote : null,
      typeof body.tourMapUrl === 'string' ? body.tourMapUrl : null,
      featured,
      publish,
      typeof body.heroImageUrl === 'string' ? body.heroImageUrl : null,
    ],
  );

  const packageId = result.insertId;

  // Nested writes (best-effort; UI can be phased in later)
  const pricingTiers = Array.isArray(body.pricingTiers) ? body.pricingTiers : [];
  const highlights = Array.isArray(body.tourHighlights) ? body.tourHighlights : [];
  const included = Array.isArray(body.included) ? body.included : [];
  const excluded = Array.isArray(body.excluded) ? body.excluded : [];
  const relatedPackageIds = Array.isArray(body.relatedPackageIds) ? body.relatedPackageIds : [];
  const mediaItems = Array.isArray(body.media) ? body.media : [];

  await pool.query('DELETE FROM package_price_tiers WHERE package_id = ?', [packageId]);
  await pool.query('DELETE FROM package_highlights WHERE package_id = ?', [packageId]);
  await pool.query('DELETE FROM package_included WHERE package_id = ?', [packageId]);
  await pool.query('DELETE FROM package_excluded WHERE package_id = ?', [packageId]);
  await pool.query('DELETE FROM package_related_packages WHERE package_id = ?', [packageId]);
  await pool.query('DELETE FROM package_media WHERE package_id = ?', [packageId]);

  if (pricingTiers.length) {
    for (let i = 0; i < pricingTiers.length; i += 1) {
      const t = pricingTiers[i];
      await pool.query(
        `
        INSERT INTO package_price_tiers
          (package_id, min_person, max_person, price_per_person, currency, sort_order)
        VALUES
          (?, ?, ?, ?, ?, ?)
        `,
        [
          packageId,
          toInt(t.minPerson) ?? 1,
          toInt(t.maxPerson) ?? toInt(t.minPerson) ?? 1,
          Number(t.pricePerPerson ?? 0),
          typeof t.currency === 'string' ? t.currency : 'USD',
          i,
        ],
      );
    }
  }

  for (let i = 0; i < highlights.length; i += 1) {
    if (typeof highlights[i] !== 'string') continue;
    await pool.query('INSERT INTO package_highlights (package_id, text, sort_order) VALUES (?, ?, ?)', [
      packageId,
      highlights[i],
      i,
    ]);
  }

  for (let i = 0; i < included.length; i += 1) {
    if (typeof included[i] !== 'string') continue;
    await pool.query('INSERT INTO package_included (package_id, text, sort_order) VALUES (?, ?, ?)', [
      packageId,
      included[i],
      i,
    ]);
  }

  for (let i = 0; i < excluded.length; i += 1) {
    if (typeof excluded[i] !== 'string') continue;
    await pool.query('INSERT INTO package_excluded (package_id, text, sort_order) VALUES (?, ?, ?)', [
      packageId,
      excluded[i],
      i,
    ]);
  }

  for (let i = 0; i < relatedPackageIds.length; i += 1) {
    const rid = Number(relatedPackageIds[i]);
    if (!Number.isFinite(rid)) continue;
    await pool.query(
      'INSERT INTO package_related_packages (package_id, related_package_id, sort_order) VALUES (?, ?, ?)',
      [packageId, rid, i],
    );
  }

  for (let i = 0; i < mediaItems.length; i += 1) {
    const m = mediaItems[i];
    const mediaType = m.type === 'VIDEO' ? 'VIDEO' : 'IMAGE';
    const srcUrl = typeof m.srcUrl === 'string' ? m.srcUrl : null;
    const videoEmbedUrl = typeof m.videoEmbedUrl === 'string' ? m.videoEmbedUrl : null;
    const thumbnailUrl = typeof m.thumbnailUrl === 'string' ? m.thumbnailUrl : null;

    const isThumb = toBool(m.isThumbnail);
    const thumbnailSort = m.thumbnailSortOrder == null ? null : toInt(m.thumbnailSortOrder);

    await pool.query(
      `
      INSERT INTO package_media
        (package_id, media_type, src_url, video_embed_url, title, caption, thumbnail_url, sort_order, is_thumbnail, thumbnail_sort_order)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        packageId,
        mediaType,
        srcUrl,
        videoEmbedUrl,
        typeof m.title === 'string' ? m.title : null,
        typeof m.caption === 'string' ? m.caption : null,
        thumbnailUrl,
        typeof m.sortOrder === 'number' ? m.sortOrder : i,
        isThumb,
        isThumb ? (thumbnailSort ?? i) : null,
      ],
    );
  }

  return res.status(201).json({ ok: true, id: packageId });
});

router.put('/:id', async (req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();

  const packageId = Number(req.params.id);
  if (!Number.isFinite(packageId)) return res.status(400).json({ error: { message: 'Invalid id' } });

  const body = req.body ?? {};
  const slug = typeof body.slug === 'string' ? body.slug : null;
  const name = typeof body.name === 'string' ? body.name : null;
  if (!slug || !name) return res.status(400).json({ error: { message: 'slug and name are required' } });

  const featured = toBool(body.featured);
  const publish = toBool(body.publish);

  await pool.query(
    `
    UPDATE packages SET
      slug = ?,
      name = ?,
      duration = ?,
      tourType = ?,
      maxPeople = ?,
      minAge = ?,
      scheduling_mode = ?,
      overview = ?,
      seoDescription = ?,
      price_base = ?,
      price_note = ?,
      tour_map_url = ?,
      featured = ?,
      publish = ?,
      hero_image_url = ?
    WHERE id = ?
    `,
    [
      slug,
      name,
      typeof body.duration === 'string' ? body.duration : '',
      typeof body.tourType === 'string' ? body.tourType : null,
      toInt(body.maxPeople),
      toInt(body.minAge),
      body.schedulingMode === 'FLEXIBLE_DATES' ? 'FLEXIBLE_DATES' : 'FIXED_DEPARTURES',
      typeof body.overview === 'string' ? body.overview : null,
      typeof body.seoDescription === 'string' ? body.seoDescription : null,
      body.priceBase == null ? null : Number(body.priceBase),
      typeof body.priceNote === 'string' ? body.priceNote : null,
      typeof body.tourMapUrl === 'string' ? body.tourMapUrl : null,
      featured,
      publish,
      typeof body.heroImageUrl === 'string' ? body.heroImageUrl : null,
      packageId,
    ],
  );

  // Replace nested collections (simpler MVP)
  await pool.query('DELETE FROM package_price_tiers WHERE package_id = ?', [packageId]);
  await pool.query('DELETE FROM package_highlights WHERE package_id = ?', [packageId]);
  await pool.query('DELETE FROM package_included WHERE package_id = ?', [packageId]);
  await pool.query('DELETE FROM package_excluded WHERE package_id = ?', [packageId]);
  await pool.query('DELETE FROM package_related_packages WHERE package_id = ?', [packageId]);
  await pool.query('DELETE FROM package_media WHERE package_id = ?', [packageId]);

  const pricingTiers = Array.isArray(body.pricingTiers) ? body.pricingTiers : [];
  const highlights = Array.isArray(body.tourHighlights) ? body.tourHighlights : [];
  const included = Array.isArray(body.included) ? body.included : [];
  const excluded = Array.isArray(body.excluded) ? body.excluded : [];
  const relatedPackageIds = Array.isArray(body.relatedPackageIds) ? body.relatedPackageIds : [];
  const mediaItems = Array.isArray(body.media) ? body.media : [];

  if (pricingTiers.length) {
    for (let i = 0; i < pricingTiers.length; i += 1) {
      const t = pricingTiers[i];
      await pool.query(
        `
        INSERT INTO package_price_tiers
          (package_id, min_person, max_person, price_per_person, currency, sort_order)
        VALUES
          (?, ?, ?, ?, ?, ?)
        `,
        [
          packageId,
          toInt(t.minPerson) ?? 1,
          toInt(t.maxPerson) ?? toInt(t.minPerson) ?? 1,
          Number(t.pricePerPerson ?? 0),
          typeof t.currency === 'string' ? t.currency : 'USD',
          i,
        ],
      );
    }
  }

  for (let i = 0; i < highlights.length; i += 1) {
    if (typeof highlights[i] !== 'string') continue;
    await pool.query('INSERT INTO package_highlights (package_id, text, sort_order) VALUES (?, ?, ?)', [
      packageId,
      highlights[i],
      i,
    ]);
  }

  for (let i = 0; i < included.length; i += 1) {
    if (typeof included[i] !== 'string') continue;
    await pool.query('INSERT INTO package_included (package_id, text, sort_order) VALUES (?, ?, ?)', [
      packageId,
      included[i],
      i,
    ]);
  }

  for (let i = 0; i < excluded.length; i += 1) {
    if (typeof excluded[i] !== 'string') continue;
    await pool.query('INSERT INTO package_excluded (package_id, text, sort_order) VALUES (?, ?, ?)', [
      packageId,
      excluded[i],
      i,
    ]);
  }

  for (let i = 0; i < relatedPackageIds.length; i += 1) {
    const rid = Number(relatedPackageIds[i]);
    if (!Number.isFinite(rid)) continue;
    await pool.query(
      'INSERT INTO package_related_packages (package_id, related_package_id, sort_order) VALUES (?, ?, ?)',
      [packageId, rid, i],
    );
  }

  for (let i = 0; i < mediaItems.length; i += 1) {
    const m = mediaItems[i];
    const mediaType = m.type === 'VIDEO' ? 'VIDEO' : 'IMAGE';
    const srcUrl = typeof m.srcUrl === 'string' ? m.srcUrl : null;
    const videoEmbedUrl = typeof m.videoEmbedUrl === 'string' ? m.videoEmbedUrl : null;
    const thumbnailUrl = typeof m.thumbnailUrl === 'string' ? m.thumbnailUrl : null;

    const isThumb = toBool(m.isThumbnail);
    const thumbnailSort = m.thumbnailSortOrder == null ? null : toInt(m.thumbnailSortOrder);

    await pool.query(
      `
      INSERT INTO package_media
        (package_id, media_type, src_url, video_embed_url, title, caption, thumbnail_url, sort_order, is_thumbnail, thumbnail_sort_order)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        packageId,
        mediaType,
        srcUrl,
        videoEmbedUrl,
        typeof m.title === 'string' ? m.title : null,
        typeof m.caption === 'string' ? m.caption : null,
        thumbnailUrl,
        typeof m.sortOrder === 'number' ? m.sortOrder : i,
        isThumb,
        isThumb ? (thumbnailSort ?? i) : null,
      ],
    );
  }

  return res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();

  const packageId = Number(req.params.id);
  if (!Number.isFinite(packageId)) return res.status(400).json({ error: { message: 'Invalid id' } });

  await pool.query('DELETE FROM packages WHERE id = ? LIMIT 1', [packageId]);
  return res.json({ ok: true });
});

export default router;

