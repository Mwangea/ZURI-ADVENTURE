import { Router } from 'express';

import { ensureSchema, isDbReady, pool } from '../lib/db.js';
import { requireAdminJwt } from '../middleware/adminAuth.js';

const router = Router();
router.use(requireAdminJwt);

const STATUS_VALUES = new Set(['NEW', 'IN_REVIEW', 'CONFIRMED', 'CANCELLED']);

router.get('/', async (_req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();

  const [rows] = await pool.query(
    `
    SELECT
      e.id,
      e.full_name AS fullName,
      e.email,
      e.phone,
      e.message,
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
    ORDER BY e.created_at DESC
    LIMIT 200
    `,
  );
  return res.json({ enquiries: rows });
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

export default router;
