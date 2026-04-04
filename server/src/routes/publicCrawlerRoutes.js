import { Router } from 'express';

import { ensureSchema, isDbReady, pool } from '../lib/db.js';
import { env } from '../lib/env.js';

const router = Router();

function siteOrigin() {
  return String(env.SITE_URL ?? 'http://localhost:5173').replace(/\/$/, '');
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function urlEntry(loc, lastmod, changefreq, priority) {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

router.get('/robots.txt', (_req, res) => {
  const base = siteOrigin();
  res.type('text/plain; charset=utf-8');
  res.send(
    `User-agent: *
Allow: /
Disallow: /admin

Sitemap: ${base}/sitemap.xml
`,
  );
});

router.get('/sitemap.xml', async (_req, res) => {
  res.type('application/xml; charset=utf-8');

  const base = siteOrigin();
  const today = new Date().toISOString().slice(0, 10);
  const entries = [];

  const push = (path, lastmod, changefreq, priority) => {
    const loc = `${base}${path.startsWith('/') ? path : `/${path}`}`;
    entries.push(urlEntry(loc, lastmod, changefreq, priority));
  };

  push('/', today, 'daily', '1.0');
  push('/packages', today, 'daily', '0.9');
  push('/adventures', today, 'daily', '0.9');
  push('/payments', today, 'monthly', '0.6');
  push('/privacy-policy', today, 'monthly', '0.5');
  push('/terms-of-service', today, 'monthly', '0.5');
  push('/cancellation-policy', today, 'monthly', '0.5');

  if (isDbReady()) {
    try {
      await ensureSchema();
      const [pkgRows] = await pool.query(
        `
        SELECT slug, DATE_FORMAT(COALESCE(updated_at, created_at), '%Y-%m-%d') AS lm
        FROM packages
        WHERE publish = 1
        ORDER BY updated_at DESC
        `,
      );
      for (const row of pkgRows ?? []) {
        if (!row?.slug) continue;
        push(`/packages/${row.slug}`, row.lm || today, 'weekly', '0.85');
      }
      const [advRows] = await pool.query(
        `
        SELECT slug, DATE_FORMAT(COALESCE(updated_at, created_at), '%Y-%m-%d') AS lm
        FROM adventures
        WHERE publish = 1
        ORDER BY updated_at DESC
        `,
      );
      for (const row of advRows ?? []) {
        if (!row?.slug) continue;
        push(`/adventures/${row.slug}`, row.lm || today, 'weekly', '0.85');
      }
      const [policyRows] = await pool.query(
        `
        SELECT slug, DATE_FORMAT(COALESCE(updated_at, created_at), '%Y-%m-%d') AS lm
        FROM content_policies
        WHERE publish = 1 AND slug IS NOT NULL AND TRIM(slug) <> ''
        ORDER BY id ASC
        `,
      );
      for (const row of policyRows ?? []) {
        const slug = String(row.slug ?? '').trim();
        if (!slug) continue;
        push(`/policies/${encodeURIComponent(slug)}`, row.lm || today, 'monthly', '0.45');
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[sitemap] failed to load slugs:', err?.message ?? err);
    }
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`;

  res.send(body);
});

export default router;
