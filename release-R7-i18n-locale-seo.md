# R7 - i18n content + locale SEO (Backlog)

## Goal
After v1 is live, add multilingual UI and content with SEO-friendly locale URLs.

## Scope (later)
- UI locale switcher (English default)
- RTL support for Arabic (`ar`) and Hebrew (`he`)
- Locale URL strategy:
  - `/fr/...`, `/es/...`, `/de/...`, `/ar/...`, `/he/...`, `/zh/...`, `/ja/...`, `/ru/...`, `/el/...`
- `hreflang` tags across locales
- Multilingual content delivered from the API (not just client-side JS translation)

## Acceptance criteria
- Each locale has crawlable content and correct metadata.
- Arabic/Hebrew pages render correctly (RTL + alignment).
