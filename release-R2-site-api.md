# R2 - Site ↔ API (Frontend integration)

## Goal
Replace the current template/local config data source with your Express API for public pages.

## Scope
- Packages pages
  - Listing: fetch packages from `/api/v1/packages`
  - Detail: fetch by slug from `/api/v1/packages/:slug`
  - Ensure SEO component (`Seo`) gets title/description/OG data from API
- Adventures pages
  - Listing: fetch from `/api/v1/adventures`
  - Detail: fetch by slug/id from `/api/v1/adventures/:slug`
  - Ensure `Seo` and JSON-LD use fetched data
- Filters + search (simple v1)
  - Basic client-side filter UI wired to API parameters (if provided) or filter results locally.

## Acceptance criteria
- Public pages load real package/adventure data from the API.
- Navigating between routes works.
- Booking modal opens with correct package choice (wired later if needed).
