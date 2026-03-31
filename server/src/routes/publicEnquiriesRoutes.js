import { Router } from 'express';

import { ensureSchema, isDbReady, pool } from '../lib/db.js';
import { sendEnquiryEmails } from '../lib/email.js';

const router = Router();

function trimString(value, max = 500) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function toInt(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function makeReferenceCode(insertId) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `ZA-${y}${m}${d}-${String(insertId).padStart(5, '0')}`;
}

router.post('/', async (req, res) => {
  if (!isDbReady()) return res.status(503).json({ error: { message: 'Database not configured' } });
  await ensureSchema();

  const body = req.body ?? {};
  const fullName = trimString(body.fullName, 255);
  const email = trimString(body.email, 255);
  const phone = trimString(body.phone, 50);
  const notes = trimString(body.notes, 4000);
  const packageSlug = trimString(body.packageSlug, 255);
  const partySize = toInt(body.partySize);
  const preferredDate = trimString(body.preferredDate, 20);
  const departureId = toInt(body.departureId);

  if (!fullName || !email || !phone) {
    return res.status(400).json({ error: { message: 'fullName, email and phone are required' } });
  }
  let pkg = null;
  const hasBookingFields = partySize != null || Boolean(preferredDate) || departureId != null;
  if (packageSlug) {
    const [pkgRows] = await pool.query(
      `
      SELECT id, name, scheduling_mode
      FROM packages
      WHERE slug = ? AND publish = 1
      LIMIT 1
      `,
      [packageSlug],
    );
    pkg = pkgRows?.[0] ?? null;
    if (!pkg) return res.status(404).json({ error: { message: 'Package not found' } });

    // Only enforce booking constraints when booking-specific fields are provided.
    if (hasBookingFields) {
      if (!partySize || partySize < 1 || partySize > 100) {
        return res.status(400).json({ error: { message: 'partySize must be between 1 and 100 for package bookings' } });
      }
      if (pkg.scheduling_mode === 'FIXED_DEPARTURES' && !departureId) {
        return res.status(400).json({ error: { message: 'departureId is required for fixed departures' } });
      }
      if (pkg.scheduling_mode === 'FLEXIBLE_DATES' && !preferredDate) {
        return res.status(400).json({ error: { message: 'preferredDate is required for flexible dates' } });
      }

      if (departureId) {
        const [depRows] = await pool.query(
          `
          SELECT id
          FROM package_departures
          WHERE id = ? AND package_id = ? AND publish = 1
          LIMIT 1
          `,
          [departureId, pkg.id],
        );
        if (!depRows?.[0]) {
          return res.status(400).json({ error: { message: 'Invalid departure for selected package' } });
        }
      }
    }
  } else if (!notes) {
    return res.status(400).json({ error: { message: 'notes is required for general enquiries' } });
  }

  const [result] = await pool.query(
    `
    INSERT INTO enquiries
      (full_name, email, phone, message, package_id, status, party_size, preferred_date, departure_id)
    VALUES
      (?, ?, ?, ?, ?, 'NEW', ?, ?, ?)
    `,
    [
      fullName,
      email,
      phone,
      notes || null,
      pkg?.id ?? null,
      partySize ?? null,
      preferredDate || null,
      departureId ?? null,
    ],
  );

  const enquiryId = result.insertId;
  const referenceCode = makeReferenceCode(enquiryId);
  await pool.query('UPDATE enquiries SET reference_code = ? WHERE id = ?', [referenceCode, enquiryId]);

  sendEnquiryEmails({
    referenceCode,
    fullName,
    email,
    phone,
    packageName: pkg?.name ?? '',
    notes,
    partySize,
    preferredDate,
    departureId,
  }).catch((error) => {
    console.error('[email] failed to send enquiry emails:', error?.message ?? error);
  });

  return res.status(201).json({
    ok: true,
    enquiryId,
    referenceCode,
    status: 'NEW',
  });
});

export default router;
