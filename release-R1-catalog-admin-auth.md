# R1 - Catalog + admin auth

## Status
Done

## Goal
Enable CRUD for packages/adventures in the admin, and expose public listing/detail endpoints.

## Delivery note
R1 is marked complete for the agreed implementation scope in this cycle, including admin auth, admin CRUD, dashboard with real data, media uploads, and video embed URL support in package media.

## Scope
- Admin UI screens (first-class requirement for this release)
  - `/admin/login` page (email/password)
  - Route guard for `/admin/*` (JWT required)
  - `/admin/dashboard` landing screen (summary cards: packages count, enquiries count, recent changes)
  - `/admin/packages`
    - List view (table or cards)
    - Create button
    - Edit action
    - Delete with confirmation
    - Toggle `featured` / publish status
  - `/admin/packages/:id`
    - Full package editor with sections:
      - Core fields: `name`, `slug`, `duration`, `tourType`, `maxPeople`, `minAge`, `seoDescription`
      - Media manager:
        - Mixed media gallery (images + videos together):
          - Upload images, add video embed URLs
          - One unified reorder list (drag/drop) across media types
          - Preview each item and delete any item
        - Thumbnail strip (admin picks)
          - Admin selects which mixed-media items appear as thumbnails
          - Thumbnails have their own order (separate from the main mixed-media order)
          - Video thumbnails are allowed via poster/thumbnail URL (v1: require admin to provide it)
      - Pricing editor:
        - Pricing tiers table (e.g. 1-2, 3-5, 6-10, etc.) with price per person
      - Overview editor (rich text or textarea)
      - Tour highlights list (reorderable bullet list)
      - Included/Excluded editor (two lists)
      - Gallery thumbnail ordering (what appears in the public thumbnail strip)
      - “You may like” relation picker (select related packages/adventures)
      - Tour map/link field (if you store a URL or coordinates)
  - `/admin/adventures`
    - List/create/edit/delete
    - Editor fields: title/subtitle/description + image + related package relation
  - `/admin/enquiries` (read-only for this release, if backend supports it)
    - Table view with basic status
    - MVP status lifecycle actions:
      - `NEW`
      - `IN_REVIEW`
      - `CONFIRMED`
      - `CANCELLED`
    - Internal note field (optional) and save action

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
- Admin package editor can create/update a package with:
  - multiple gallery images
  - video embed URL(s)
  - pricing tiers table
  - overview + highlights + included/excluded lists
