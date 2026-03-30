import { Router } from 'express';

import { ensureSchema, isDbReady, pool } from '../lib/db.js';

const router = Router();

function formatMoney(amount, currency) {
  if (amount == null) return null;
  const num = typeof amount === 'number' ? amount : Number(amount);
  const rounded = Number.isFinite(num) ? num : 0;
  if (currency === 'USD') return `$${rounded}`;
  return `${currency} ${rounded}`;
}

router.get('/', async (req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();

  const limit = Math.min(Number(req.query.limit ?? 50), 100);
  const featuredOnly = String(req.query.featured ?? '').toLowerCase() === '1';
  const offset = Math.max(Number(req.query.offset ?? 0), 0);

  const where = featuredOnly ? 'WHERE publish = 1 AND featured = 1' : 'WHERE publish = 1';

  const sql = `
    SELECT
      p.id,
      p.slug,
      p.name,
      p.duration,
      p.price_note,
      p.featured,
      p.hero_image_url,
      COALESCE(
        MIN(t.price_per_person),
        p.price_base
      ) AS price_from,
      COALESCE(
        MIN(t.currency),
        'USD'
      ) AS currency
    FROM packages p
    LEFT JOIN package_price_tiers t ON t.package_id = p.id
    ${where}
    GROUP BY p.id
    ORDER BY p.featured DESC, p.updated_at DESC
    LIMIT ? OFFSET ?
  `;

  const [rows] = await pool.query(sql, [limit, offset]);

  const packages = rows.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    duration: p.duration,
    featured: Boolean(p.featured),
    image: p.hero_image_url,
    price: formatMoney(p.price_from, p.currency),
    priceNote: p.price_note,
  }));

  return res.json({ packages });
});

router.get('/:slug', async (req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();

  const slug = req.params.slug;
  const [pkgRows] = await pool.query('SELECT * FROM packages WHERE slug = ? AND publish = 1 LIMIT 1', [slug]);
  const pkg = pkgRows?.[0];
  if (!pkg) return res.status(404).json({ error: { message: 'Package not found' } });

  // Pricing tiers
  const [tiers] = await pool.query(
    `
    SELECT min_person, max_person, price_per_person, currency, sort_order
    FROM package_price_tiers
    WHERE package_id = ?
    ORDER BY sort_order ASC, min_person ASC
    `,
    [pkg.id],
  );
  const priceFrom = tiers.length ? Math.min(...tiers.map((t) => Number(t.price_per_person))) : pkg.price_base;
  const currency = tiers.length ? tiers[0].currency : 'USD';

  // Media (full gallery order)
  const [media] = await pool.query(
    `
    SELECT
      id,
      media_type,
      src_url,
      video_embed_url,
      title,
      caption,
      thumbnail_url,
      sort_order,
      is_thumbnail,
      thumbnail_sort_order
    FROM package_media
    WHERE package_id = ?
    ORDER BY sort_order ASC
    `,
    [pkg.id],
  );

  // Thumbnails (admin-picked order)
  const [thumbnails] = await pool.query(
    `
    SELECT
      id,
      media_type,
      src_url,
      video_embed_url,
      title,
      caption,
      thumbnail_url,
      sort_order,
      is_thumbnail,
      thumbnail_sort_order
    FROM package_media
    WHERE package_id = ? AND is_thumbnail = 1
    ORDER BY COALESCE(thumbnail_sort_order, sort_order) ASC
    `,
    [pkg.id],
  );

  const [highlights] = await pool.query(
    'SELECT text, sort_order FROM package_highlights WHERE package_id = ? ORDER BY sort_order ASC',
    [pkg.id],
  );
  const [included] = await pool.query(
    'SELECT text, sort_order FROM package_included WHERE package_id = ? ORDER BY sort_order ASC',
    [pkg.id],
  );
  const [excluded] = await pool.query(
    'SELECT text, sort_order FROM package_excluded WHERE package_id = ? ORDER BY sort_order ASC',
    [pkg.id],
  );

  const [related] = await pool.query(
    `
    SELECT
      r.related_package_id,
      p2.slug AS related_slug,
      p2.name AS related_name,
      p2.hero_image_url AS related_image,
      rp.sort_order
    FROM package_related_packages rp
    JOIN packages p2 ON p2.id = rp.related_package_id
    JOIN packages p1 ON p1.id = rp.package_id
    WHERE rp.package_id = ? AND p2.publish = 1
    ORDER BY rp.sort_order ASC
    `,
    [pkg.id],
  );

  return res.json({
    package: {
      id: pkg.id,
      slug: pkg.slug,
      name: pkg.name,
      duration: pkg.duration,
      tourType: pkg.tourType,
      maxPeople: pkg.maxPeople,
      minAge: pkg.minAge,
      schedulingMode: pkg.scheduling_mode,
      featured: Boolean(pkg.featured),
      priceFrom: formatMoney(priceFrom, currency),
      priceNote: pkg.price_note,
      heroImage: pkg.hero_image_url,
      seoDescription: pkg.seoDescription,
      tourMapUrl: pkg.tour_map_url,
      overview: pkg.overview,
      priceTiers: tiers.map((t) => ({
        id: t.id,
        minPerson: t.min_person,
        maxPerson: t.max_person,
        pricePerPerson: formatMoney(t.price_per_person, t.currency),
        currency: t.currency,
      })),
      media: media.map((m) => ({
        id: m.id,
        type: m.media_type,
        srcUrl: m.src_url,
        videoEmbedUrl: m.video_embed_url,
        title: m.title,
        caption: m.caption,
        thumbnailUrl: m.thumbnail_url,
        sortOrder: m.sort_order,
        isThumbnail: Boolean(m.is_thumbnail),
        thumbnailSortOrder: m.thumbnail_sort_order,
      })),
      thumbnails: thumbnails.map((m) => ({
        id: m.id,
        type: m.media_type,
        srcUrl: m.src_url,
        videoEmbedUrl: m.video_embed_url,
        title: m.title,
        caption: m.caption,
        thumbnailUrl: m.thumbnail_url,
        sortOrder: m.sort_order,
        thumbnailSortOrder: m.thumbnail_sort_order,
      })),
      tourHighlights: highlights.map((h) => h.text),
      included: included.map((i) => i.text),
      excluded: excluded.map((e) => e.text),
      relatedPackages: related.map((r) => ({
        slug: r.related_slug,
        name: r.related_name,
        image: r.related_image,
      })),
    },
  });
});

export default router;

