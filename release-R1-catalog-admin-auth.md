# R1 - Catalog + admin auth

## Goal
Enable CRUD for packages/adventures in the admin, and expose public listing/detail endpoints.

## Scope
- Admin authentication:
  - Email/password login
  - JWT access token
  - Refresh token via secure cookie (same-site)
  - Admin role check on every write endpoint
- Data model (minimum for v1):
  - Packages
    - `slug`, `name`, `duration`, `price`, `priceNote`, `image`, `featured`
    - `scheduling_mode`:
      - `FIXED_DEPARTURES` (has departure instances)
      - `FLEXIBLE_DATES` (client chooses preferred dates; confirmed dates later)
  - Adventures (day trips / destinations)
    - `id`/slug, `title`, `subtitle`, `description`, `image`, `related_package_slug` (or relation)
  - Tags / filters fields as structured data
- Admin CRUD endpoints:
  - Create/read/update/delete packages
  - Create/read/update/delete adventures
  - Publish/unpublish (optional for v1; recommended)
- Public endpoints:
  - `GET /api/v1/packages` (supports basic filters)
  - `GET /api/v1/packages/:slug`
  - `GET /api/v1/adventures` (grid list)
  - `GET /api/v1/adventures/:slug`

## Acceptance criteria
- Admin can log in and receive an access token.
- Admin write endpoints reject requests without valid admin JWT.
- Public endpoints return consistent JSON for the frontend to render.
