# R4 - Content admin

## Goal
Enable admin to manage marketing content without redeploying the frontend.

## Scope
Admin CRUD UI + API for:
- Hero content (background image + title/subtitle/CTA)
- Testimonials
  - create/edit/delete
  - reorder and show/hide (optional)
- Promo banner / popup
  - activate/deactivate
  - message, link target, CTA label
  - optional start/end schedule
- Policies content
  - Terms, Privacy, Cancellation
  - route slug mapping to footer links
- Gallery
  - images: upload + reorder + caption + delete
  - videos: v1 embed URLs (YouTube/Vimeo) with title/caption; later support self-hosted files

## Acceptance criteria
- Admin can update each section and see changes on the public site after publish.
- Promo banner can be toggled and scheduled.
