# R6 - SEO + polish (English-first)

## Goal
Make the English site crawlable and shareable with strong metadata and structured data.

## Scope
- Sitemap generation from published packages/adventures.
- Ensure per-route:
  - `title`, `meta description`, `canonical`
  - `og:*` and `twitter:*`
- Structured data:
  - keep JSON-LD for breadcrumbs + packages/adventures in sync with API data
- Optional PDF itinerary (English) as a later enhancement after R3 booking records exist.
- Rate limits and spam protection should not break crawler access to public pages.

## Acceptance criteria
- `/sitemap.xml` exists and includes key public pages.
- Package/adventure pages have unique titles and OG images.
