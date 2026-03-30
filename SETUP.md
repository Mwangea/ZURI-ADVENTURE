# Zuri Adventures - Setup Guide

## 1) Frontend (this repo)

```bash
npm install
npm run dev
```

The public site currently renders data from `src/config.ts` (starter/template stage). After you start the API-backed releases, those screens will load from your Express API.

## 2) Backend (planned)

You said you will use **Node.js + Express** with a versioned REST API:
- Prefer `/api/v1/...` (resources + HTTP verbs)
- Recommended default URL style (same domain): `https://zuriadventures.com/api/v1/...`

## 3) Frontend configuration (starter/template stage)

Early on, content is controlled through `src/config.ts`.

Key exports you will edit:
- `siteConfig` (site name/description)
- `heroConfig` (hero title/subtitle + background image)
- `narrativeTextConfig`
- `zigZagGridConfig` (adventures grid items)
- `breathSectionConfig`
- `cardStackConfig`
- `testimonialsConfig`
- `galleryConfig`
- `faqConfig`
- `packagesConfig` (package list)
- `footerConfig`

## 4) Required images

Place images in the `public/` directory:
- `hero-bg.jpg` (hero background)
- `safari-elephant.jpg` (breath section background)
- One image per card/item used by the current configs (see `src/config.ts`)
- `footer-cabin.jpg` (footer background; optional)

## 5) Next steps

Start with the next release in `README.md` (R0), then proceed row-by-row (R1, R2, ...).
