# R4 - Content admin

## Goal
Enable admin to manage marketing content without redeploying the frontend.

## Scope
- Admin UI screens
  - `/admin/content/hero`
    - upload/replace hero background image
    - edit hero title/subtitle/CTA
    - publish toggle
  - `/admin/content/testimonials`
    - testimonials list with reorder
    - create/edit/delete testimonial (quote, name, location, avatar)
    - publish toggle (optional)
  - `/admin/content/promo-banner`
    - banner enable/disable toggle
    - edit message + CTA label + link target
    - optional schedule start/end dates
  - `/admin/content/policies`
    - edit Terms / Privacy / Cancellation content
    - map policy to public route slugs used in the footer
  - `/admin/media/gallery`
    - gallery media library UI:
      - upload images (multiple)
      - upload video URLs (YouTube/Vimeo embeds) or later file uploads
      - reorder, delete
      - associate media with public gallery sections (if needed)

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
- Admin gallery supports multi-image upload + reorder + delete with immediate preview.
