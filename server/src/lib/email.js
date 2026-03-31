import nodemailer from 'nodemailer';
import fs from 'node:fs';
import path from 'node:path';

import { env } from './env.js';

function parseRecipients(value) {
  if (!value) return [];
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function hasSmtpConfig() {
  return Boolean(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS && env.EMAIL_FROM);
}

function buildTransport() {
  if (!hasSmtpConfig()) return null;
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function resolveLogoAttachment() {
  const logoPath = path.resolve(process.cwd(), '..', 'public', 'zuri-logo.png');
  if (!fs.existsSync(logoPath)) return null;
  return {
    filename: 'zuri-logo.png',
    path: logoPath,
    cid: 'zuri-logo',
  };
}

function sharpButton(label, href, variant = 'teal') {
  const styles =
    variant === 'yellow'
      ? 'background:#f3bb2f;color:#0f1b20;border:1px solid #d6a31f;'
      : 'background:#0f969c;color:#ffffff;border:1px solid #0b7f84;';
  return `
    <a href="${escapeHtml(href)}" style="display:inline-block;padding:10px 14px;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;${styles}">
      ${escapeHtml(label)}
    </a>
  `;
}

function layoutEmail({ title, subtitle, bodyHtml, accent = '#0f969c', includeExplore = false }) {
  const packagesUrl = `${env.SITE_URL.replace(/\/$/, '')}/packages`;
  const adventuresUrl = `${env.SITE_URL.replace(/\/$/, '')}/adventures`;
  return `
  <div style="margin:0;padding:24px;background:#eef2f2;font-family:Arial,sans-serif;color:#1f2a30;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #d7dee0;">
      <tr>
        <td style="padding:18px 24px;border-bottom:3px solid ${accent};background:#ffffff;">
          <img src="cid:zuri-logo" alt="Zuri Adventure" style="height:58px;width:auto;display:block;" />
        </td>
      </tr>
      <tr>
        <td style="padding:18px 24px;background:#11242b;color:#fff;border-bottom:1px solid #2d4249;">
          <h1 style="margin:0;font-size:20px;line-height:1.3;font-weight:700;letter-spacing:.02em;">${escapeHtml(title)}</h1>
          ${subtitle ? `<p style="margin:8px 0 0;font-size:13px;color:#c7d8dd;">${escapeHtml(subtitle)}</p>` : ''}
        </td>
      </tr>
      <tr>
        <td style="padding:22px 24px;font-size:14px;line-height:1.65;color:#1f2a30;">
          ${bodyHtml}
        </td>
      </tr>
      ${
        includeExplore
          ? `
      <tr>
        <td style="padding:16px 24px;border-top:1px solid #dde5e7;background:#f7fafb;">
          <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#1f2a30;">Explore More</p>
          <p style="margin:0 0 14px;font-size:13px;color:#54656d;">Discover more adventures and packages while we prepare your request.</p>
          ${sharpButton('View Packages', packagesUrl, 'yellow')}
          <span style="display:inline-block;width:8px;"></span>
          ${sharpButton('View Adventures', adventuresUrl, 'teal')}
        </td>
      </tr>
      `
          : ''
      }
      <tr>
        <td style="padding:14px 24px;background:#edf3f4;color:#60727a;font-size:12px;border-top:1px solid #dbe3e5;">
          Zuri Adventure | Professional Travel Planning
        </td>
      </tr>
    </table>
  </div>
  `;
}

export async function sendEnquiryEmails(payload) {
  const {
    referenceCode,
    fullName,
    email,
    phone,
    packageName,
    notes,
    partySize,
    preferredDate,
    departureId,
  } = payload;
  const transporter = buildTransport();
  const staffRecipients = parseRecipients(env.ENQUIRY_STAFF_EMAILS);
  const logoAttachment = resolveLogoAttachment();

  if (!transporter || staffRecipients.length === 0) {
    // eslint-disable-next-line no-console
    console.log('[email] skipped: SMTP or ENQUIRY_STAFF_EMAILS not configured');
    return;
  }

  const bookingBits = [
    packageName ? `Package: ${packageName}` : null,
    partySize ? `Party size: ${partySize}` : null,
    preferredDate ? `Preferred date: ${preferredDate}` : null,
    departureId ? `Departure ID: ${departureId}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to: staffRecipients.join(', '),
    subject: `New enquiry ${referenceCode}`,
    text: [
      'A new enquiry was submitted.',
      '',
      `Reference: ${referenceCode}`,
      `Name: ${fullName}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      bookingBits,
      notes ? `Notes: ${notes}` : null,
    ]
      .filter(Boolean)
      .join('\n'),
    html: layoutEmail({
      title: `New enquiry ${referenceCode}`,
      subtitle: 'A new enquiry was submitted from the website.',
      bodyHtml: `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr><td style="padding:8px 0;border-bottom:1px solid #edf2f3;"><strong>Name:</strong> ${escapeHtml(fullName)}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #edf2f3;"><strong>Email:</strong> ${escapeHtml(email)}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #edf2f3;"><strong>Phone:</strong> ${escapeHtml(phone)}</td></tr>
          ${packageName ? `<tr><td style="padding:8px 0;border-bottom:1px solid #edf2f3;"><strong>Package:</strong> ${escapeHtml(packageName)}</td></tr>` : ''}
          ${partySize ? `<tr><td style="padding:8px 0;border-bottom:1px solid #edf2f3;"><strong>Party size:</strong> ${escapeHtml(partySize)}</td></tr>` : ''}
          ${preferredDate ? `<tr><td style="padding:8px 0;border-bottom:1px solid #edf2f3;"><strong>Preferred date:</strong> ${escapeHtml(preferredDate)}</td></tr>` : ''}
          ${departureId ? `<tr><td style="padding:8px 0;border-bottom:1px solid #edf2f3;"><strong>Departure ID:</strong> ${escapeHtml(departureId)}</td></tr>` : ''}
        </table>
        ${notes ? `<p style="margin:14px 0 0;"><strong>Message:</strong><br/>${escapeHtml(notes).replace(/\n/g, '<br/>')}</p>` : ''}
      `,
      includeExplore: true,
      accent: '#0f969c',
    }),
    attachments: logoAttachment ? [logoAttachment] : [],
  });

  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to: email,
    subject: `We received your enquiry (${referenceCode})`,
    text: [
      `Hi ${fullName},`,
      '',
      'Thanks for contacting Zuri Adventure. We have received your enquiry and our team will reach out shortly.',
      '',
      `Reference: ${referenceCode}`,
      packageName ? `Package: ${packageName}` : null,
      '',
      'Best regards,',
      'Zuri Adventure Team',
    ]
      .filter(Boolean)
      .join('\n'),
    html: layoutEmail({
      title: 'Enquiry Received',
      subtitle: `Reference ${referenceCode}`,
      bodyHtml: `
        <p style="margin:0 0 12px;">Hi ${escapeHtml(fullName)},</p>
        <p style="margin:0 0 12px;">
          Thanks for contacting Zuri Adventure. We have received your enquiry and our team will contact you shortly.
        </p>
        <p style="margin:0 0 12px;"><strong>Reference:</strong> ${escapeHtml(referenceCode)}</p>
        ${packageName ? `<p style="margin:0 0 12px;"><strong>Package:</strong> ${escapeHtml(packageName)}</p>` : ''}
        <p style="margin:0;">Best regards,<br/>Zuri Adventure Team</p>
      `,
      includeExplore: true,
      accent: '#f3bb2f',
    }),
    attachments: logoAttachment ? [logoAttachment] : [],
  });
}
