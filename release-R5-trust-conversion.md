# R5 - Trust + conversion

## Goal
Improve conversion from enquiry to confirmation and reduce risk.

## Scope
- UI: Trust signals + conversion elements
  - Payments info page UI (simple, readable layout; no forms)
  - Share UI on package detail page:
    - copy-link button
    - WhatsApp share with prefilled text including package name + URL
  - “Reviews” area:
    - if no reviews yet, show “No reviews yet” state (as in your example)
    - later: connect admin-submitted reviews

- Public payments information page (text-only)
- Policy routes wired to real content:
  - footer links should point to real policy routes
- Share/copy trip links:
  - copy link button
  - WhatsApp share button with prefilled text including trip name + link
- Public form hardening:
  - rate limiting
  - spam protection (honeypot / captcha integration)
- Basic UX improvements:
  - friendly error messages on failed submissions

## Acceptance criteria
- Footer policy links work.
- Share buttons are functional on package detail pages.
- Enquiries are protected against trivial spam bursts.
