import { Router } from 'express';

import { ensureSchema, isDbReady, pool } from '../lib/db.js';
import { requireAdminJwt } from '../middleware/adminAuth.js';

const router = Router();
router.use(requireAdminJwt);

const STATUS_VALUES = new Set(['NEW', 'IN_REVIEW', 'CONFIRMED', 'CANCELLED']);

router.get('/', async (req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();

  const limit = Math.min(Math.max(Number(req.query.limit ?? 20), 1), 100);
  const offset = Math.max(Number(req.query.offset ?? 0), 0);
  const status = String(req.query.status ?? '').trim().toUpperCase();
  const q = String(req.query.q ?? '')
    .trim()
    .slice(0, 80);

  const whereParts = [];
  const whereParams = [];
  if (STATUS_VALUES.has(status)) {
    whereParts.push('e.status = ?');
    whereParams.push(status);
  }
  if (q) {
    const like = `%${q}%`;
    whereParts.push(
      '(e.full_name LIKE ? OR e.email LIKE ? OR e.phone LIKE ? OR COALESCE(e.reference_code, \'\') LIKE ? OR COALESCE(p.name, \'\') LIKE ?)',
    );
    whereParams.push(like, like, like, like, like);
  }
  const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `
    SELECT
      e.id,
      e.full_name AS fullName,
      e.email,
      e.phone,
      e.message,
      e.reference_code AS referenceCode,
      e.party_size AS partySize,
      e.preferred_date AS preferredDate,
      e.departure_id AS departureId,
      CASE
        WHEN e.party_size IS NOT NULL OR e.preferred_date IS NOT NULL OR e.departure_id IS NOT NULL THEN 'BOOKING'
        ELSE 'GENERAL'
      END AS enquiryType,
      e.package_id AS packageId,
      p.name AS packageName,
      e.adventure_id AS adventureId,
      a.title AS adventureTitle,
      e.status,
      e.internal_note AS internalNote,
      e.created_at AS createdAt,
      e.updated_at AS updatedAt
    FROM enquiries e
    LEFT JOIN packages p ON p.id = e.package_id
    LEFT JOIN adventures a ON a.id = e.adventure_id
    ${whereSql}
    ORDER BY e.created_at DESC
    LIMIT ? OFFSET ?
    `,
    [...whereParams, limit, offset],
  );
  const [countRows] = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM enquiries e
    LEFT JOIN packages p ON p.id = e.package_id
    ${whereSql}
    `,
    whereParams,
  );
  const total = Number(countRows?.[0]?.total ?? 0);
  return res.json({
    enquiries: rows,
    page: {
      total,
      limit,
      offset,
      hasMore: offset + rows.length < total,
    },
  });
});

router.patch('/:id', async (req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();

  const enquiryId = Number(req.params.id);
  if (!Number.isFinite(enquiryId)) return res.status(400).json({ error: { message: 'Invalid id' } });

  const body = req.body ?? {};
  const nextStatus = typeof body.status === 'string' ? body.status : null;
  const internalNote = typeof body.internalNote === 'string' ? body.internalNote : null;
  if (nextStatus == null && internalNote == null) {
    return res.status(400).json({ error: { message: 'status or internalNote is required' } });
  }
  if (nextStatus != null && !STATUS_VALUES.has(nextStatus)) {
    return res.status(400).json({ error: { message: 'Invalid status' } });
  }

  await pool.query(
    `
    UPDATE enquiries
    SET
      status = COALESCE(?, status),
      internal_note = COALESCE(?, internal_note)
    WHERE id = ?
    `,
    [nextStatus, internalNote, enquiryId],
  );
  return res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();

  const enquiryId = Number(req.params.id);
  if (!Number.isFinite(enquiryId)) return res.status(400).json({ error: { message: 'Invalid id' } });
  await pool.query('DELETE FROM enquiries WHERE id = ?', [enquiryId]);
  return res.json({ ok: true });
});

export default router;
