import { Router } from 'express';

import { ensureSchema, isDbReady, pool } from '../lib/db.js';

const router = Router();

router.get('/', async (_req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();

  const [rows] = await pool.query(
    `
    SELECT id, slug, title, subtitle, hero_image_url
    FROM adventures
    WHERE publish = 1
    ORDER BY updated_at DESC
    LIMIT 50
    `,
  );

  return res.json({
    adventures: rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      subtitle: r.subtitle,
      image: r.hero_image_url,
    })),
  });
});

router.get('/:slug', async (req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();

  const slug = req.params.slug;
  const [rows] = await pool.query(
    `
    SELECT
      a.id,
      a.slug,
      a.title,
      a.subtitle,
      a.description,
      a.hero_image_url,
      p.slug AS related_package_slug,
      p.name AS related_package_name,
      p.hero_image_url AS related_package_image
    FROM adventures a
    LEFT JOIN packages p ON p.id = a.related_package_id
    WHERE a.slug = ? AND a.publish = 1
    LIMIT 1
    `,
    [slug],
  );
  const item = rows?.[0];
  if (!item) return res.status(404).json({ error: { message: 'Adventure not found' } });

  return res.json({
    adventure: {
      id: item.id,
      slug: item.slug,
      title: item.title,
      subtitle: item.subtitle,
      description: item.description,
      image: item.hero_image_url,
      relatedPackage: item.related_package_slug
        ? {
            slug: item.related_package_slug,
            name: item.related_package_name,
            image: item.related_package_image,
          }
        : null,
    },
  });
});

export default router;

