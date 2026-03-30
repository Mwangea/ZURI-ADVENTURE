# Zuri Adventures - Releases & Milestones

Use this document to track what you ship. Update **Status** and **Tag / notes** when each release is done.

## Release Roadmap

| Release | Status | Details | Scope (summary) |
|---------|--------|---------|-----------------|
| **R0** — API foundation | Done | [See R0](release-R0-api-foundation.md) | Express app, config/env, DB connection, `GET /health`, CORS policy chosen, `/api/v1` router shell |
| **R1** — Catalog + admin auth | Planned | [See R1](release-R1-catalog-admin-auth.md) | Packages & adventures CRUD (admin); public list/detail; `scheduling_mode` fixed vs flexible; tags; DB schema |
| **R2** — Site ↔ API | Planned | [See R2](release-R2-site-api.md) | Frontend loads catalog from API; listing filters + search (~15 packages); adventures wired same way |
| **R3** — Enquiries + email | Planned | [See R3](release-R3-enquiries-email.md) | Enquiry POST (fixed → `departure_id`; flexible → preferred dates); staff + guest notifications |
| **R4** — Content admin | Planned | [See R4](release-R4-content-admin.md) | Hero image, testimonials, scheduled promo banner, policies body, gallery (images + video URLs/embeds) |
| **R5** — Trust + conversion | Planned | [See R5](release-R5-trust-conversion.md) | Payments info page, policy routes + footer links; share/copy link + WhatsApp; rate limits + spam protection on public forms |
| **R6** — SEO + polish (English-first) | Planned | [See R6](release-R6-seo-polish.md) | English-first sitemap + per-route meta/OG basics, structured data validation; optional PDF itinerary, referrals, PWA later |
| **R7** — i18n content + locale SEO | Backlog | [See R7](release-R7-i18n-locale-seo.md) | Locale URL strategy + RTL for `ar`/`he` with `hreflang`; multilingual content loaded from API (deferred) |

## Release Workflow

Finish a row’s scope.
Mark **Status** (e.g. Done).
Add a git tag or deployment note in **Tag / notes**.
Then start the next row.

For SEO releases: ensure the admin “publish” endpoint triggers SEO cache invalidation for affected detail pages (`/packages/:slug`, `/adventures/:slug`).

## Current Defaults (for this phase)

- Public site is **English-first**.
- Admin auth is **email/password login** with **JWT** and refresh via secure cookie.
