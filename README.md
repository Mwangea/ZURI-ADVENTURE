# Zuri Adventures - Releases & Milestones

Use this document to track what you ship. Update **Status** and **Tag / notes** when each release is done.

## Release Roadmap

| Release | Status | Scope (summary) | Tag / notes |
|---------|--------|-----------------|-------------|
| **R0** — API foundation | Planned | Express app, config/env, DB connection, `GET /health`, CORS policy chosen, `/api/v1` router shell | |
| **R1** — Catalog + admin auth | Planned | Packages & adventures CRUD (admin); public list/detail; `scheduling_mode` fixed vs flexible; tags; DB schema | |
| **R2** — Site ↔ API | Planned | Frontend loads catalog from API; listing filters + search (~15 packages); adventures wired same way | |
| **R3** — Enquiries + email | Planned | Enquiry POST (fixed → `departure_id`; flexible → preferred dates); staff + guest notifications | |
| **R4** — Content admin | Planned | Hero image, testimonials, scheduled promo banner, policies body, gallery (images + video URLs/embeds) | |
| **R5** — Trust + conversion | Planned | Payments info page, policy routes + footer links; share/copy link + WhatsApp; rate limits + spam protection on public forms | |
| **R6** — SEO + polish (English-first) | Planned | English-first sitemap + per-route meta/OG basics, structured data validation; optional PDF itinerary, referrals, PWA later | i18n/content translation deferred for now |
| **R7** — i18n content + locale SEO | Backlog | Language toggle UI, RTL for `ar`/`he`, and locale URL strategy (`/fr/...`, `/he/...`, etc.) with `hreflang`; multilingual package/policy content loaded from API | deferred until after v1 is live |

## Release Workflow

Finish a row’s scope → mark **Status** (e.g. Done) → add a git tag or deployment note in **Tag / notes** → start the next row.

## Current Defaults (for this phase)

- Public site is **English-first**.
- Admin auth is **email/password login** with **JWT** and refresh via secure cookie.
