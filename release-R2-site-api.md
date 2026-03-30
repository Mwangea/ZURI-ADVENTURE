# R2 - Site ↔ API (Frontend integration)

## Goal
Replace the current template/local config data source with your Express API for public pages.

## Scope
- UI: Packages pages (API-driven)
  - Listing page
    - Fetch `GET /api/v1/packages`
    - Render cards with:
      - image, name, duration
      - price (from pricing tiers or base price)
      - featured badges (if enabled)
    - Filters + sorting UI (at least region/theme/duration or your first useful set)
  - Detail page (`/packages/:slug`)
    - Fetch `GET /api/v1/packages/:slug`
    - Render full package layout (example driven by your Prison Island / Nakupenda structure):
      - Hero image + gallery thumbnail strip
      - Gallery grid + lightbox modal
      - Video section (embed URLs)
      - Pricing section:
        - price “from” and/or show tiers table
      - Tour specs block:
        - duration, max people, min age, tour type
      - Reviews section (placeholder “No reviews yet” until R?; show rating if available)
      - Overview section (rich text or formatted paragraphs)
      - “Tour Highlights” list
      - Included/Excluded lists
      - Tour map block (URL or coordinates)
      - “You may like” related packages (based on stored relations)
  - SEO:
    - Ensure `Seo` title/description/canonical + OG image reflect fetched package fields
    - Keep JSON-LD for packages/adventures in sync with API payload

- UI: Adventures pages (API-driven)
  - Listing page
    - Fetch `GET /api/v1/adventures`
    - Render grid cards (image, subtitle, title, short description)
  - Detail page (`/adventures/:slug` or id)
    - Fetch `GET /api/v1/adventures/:slug`
    - Render overview + related package CTA
    - Ensure `Seo` and JSON-LD use fetched data

- UI: Filters + search (simple v1)
  - Basic search box + filter controls
  - Wire filters to API query params when supported, else filter locally (but keep UX consistent)

## Acceptance criteria
- Public pages load real package/adventure data from the API.
- Navigating between routes works.
- Booking modal opens with correct package choice (wired to API enquiry later in R3).
