import { Router } from 'express';

import { ensureSchema, isDbReady, pool } from '../lib/db.js';
import { requireAdminJwt } from '../middleware/adminAuth.js';

const router = Router();
router.use(requireAdminJwt);

router.get('/summary', async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');

  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();

  const rangeMonthsRaw = Number.parseInt(String(req.query.rangeMonths ?? '6'), 10);
  const rangeMonths = Number.isFinite(rangeMonthsRaw) ? Math.max(1, Math.min(12, rangeMonthsRaw)) : 6;
  const statusFilter = String(req.query.status ?? 'ALL').toUpperCase();
  const search = String(req.query.search ?? '')
    .trim()
    .slice(0, 80);
  const recentLimitRaw = Number.parseInt(String(req.query.limit ?? '10'), 10);
  const recentLimit = Number.isFinite(recentLimitRaw) ? Math.max(1, Math.min(50, recentLimitRaw)) : 10;

  const allowedStatuses = new Set(['NEW', 'IN_REVIEW', 'CONFIRMED', 'CANCELLED', 'ALL']);
  const normalizedStatus = allowedStatuses.has(statusFilter) ? statusFilter : 'ALL';

  const recentWhere = [];
  const recentParams = [];
  if (normalizedStatus !== 'ALL') {
    recentWhere.push('status = ?');
    recentParams.push(normalizedStatus);
  }
  if (search) {
    recentWhere.push('(full_name LIKE ? OR email LIKE ? OR phone LIKE ?)');
    const like = `%${search}%`;
    recentParams.push(like, like, like);
  }
  const recentWhereSql = recentWhere.length ? `WHERE ${recentWhere.join(' AND ')}` : '';

  const [[packagesCountRow]] = await pool.query('SELECT COUNT(*) AS total FROM packages');
  const [[publishedPackagesRow]] = await pool.query('SELECT COUNT(*) AS total FROM packages WHERE publish = 1');
  const [[adventuresCountRow]] = await pool.query('SELECT COUNT(*) AS total FROM adventures');
  const [[publishedAdventuresRow]] = await pool.query('SELECT COUNT(*) AS total FROM adventures WHERE publish = 1');
  const [[enquiriesCountRow]] = await pool.query('SELECT COUNT(*) AS total FROM enquiries');
  const [[confirmedEnquiriesRow]] = await pool.query(
    "SELECT COUNT(*) AS total FROM enquiries WHERE status = 'CONFIRMED'",
  );
  const [[customersCountRow]] = await pool.query(
    `
    SELECT COUNT(DISTINCT COALESCE(NULLIF(email, ''), NULLIF(phone, ''), CONCAT('guest:', full_name))) AS total
    FROM enquiries
    `,
  );

  const [recentPackages] = await pool.query(
    'SELECT id, name, slug, updated_at FROM packages ORDER BY updated_at DESC LIMIT 5',
  );
  const [recentAdventures] = await pool.query(
    'SELECT id, title AS name, slug, updated_at FROM adventures ORDER BY updated_at DESC LIMIT 5',
  );
  const [recentEnquiries] = await pool.query(
    `
    SELECT id, full_name AS customerName, status, created_at AS createdAt
    FROM enquiries
    ${recentWhereSql}
    ORDER BY created_at DESC
    LIMIT ?
    `,
    [...recentParams, recentLimit],
  );
  const [bookingOverview] = await pool.query(
    `
    SELECT DATE_FORMAT(created_at, '%b') AS monthLabel, COUNT(*) AS total
    FROM enquiries
    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
    GROUP BY YEAR(created_at), MONTH(created_at), DATE_FORMAT(created_at, '%b')
    ORDER BY YEAR(created_at), MONTH(created_at)
    `,
    [rangeMonths - 1],
  );
  const [revenueTrend] = await pool.query(
    `
    SELECT DATE_FORMAT(created_at, '%b') AS monthLabel, COUNT(*) * 120 AS total
    FROM enquiries
    WHERE status = 'CONFIRMED'
      AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
    GROUP BY YEAR(created_at), MONTH(created_at), DATE_FORMAT(created_at, '%b')
    ORDER BY YEAR(created_at), MONTH(created_at)
    `,
    [rangeMonths - 1],
  );

  return res.json({
    cards: {
      packagesTotal: Number(packagesCountRow?.total ?? 0),
      packagesPublished: Number(publishedPackagesRow?.total ?? 0),
      adventuresTotal: Number(adventuresCountRow?.total ?? 0),
      adventuresPublished: Number(publishedAdventuresRow?.total ?? 0),
      enquiriesTotal: Number(enquiriesCountRow?.total ?? 0),
      confirmedEnquiriesTotal: Number(confirmedEnquiriesRow?.total ?? 0),
      customersTotal: Number(customersCountRow?.total ?? 0),
    },
    recentPackages,
    recentAdventures,
    recentEnquiries,
    bookingOverview,
    revenueTrend,
    filters: {
      rangeMonths,
      status: normalizedStatus,
      search,
      limit: recentLimit,
    },
  });
});

export default router;
