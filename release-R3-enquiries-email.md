# R3 - Enquiries + email notifications

## Status
Done

## Goal
Let travelers submit enquiries/booking requests and notify staff and the guest.

## Scope
- UI: Booking/enquiry flow
  - Update the existing booking modal UI so it submits real data to:
    - `POST /api/v1/enquiries`
  - Validation in UI:
    - required fields (name/email/phone + package reference)
    - notes field optional
    - show inline errors (no silent failures)
  - UX improvements:
    - success state shows a reference number (if API returns one)
    - handle API errors (rate limit / validation messages)
  - If fixed vs flexible packages are supported:
    - fixed:
      - show departure/date dropdown fed from API (only future departures)
      - display availability hints if returned by API (e.g., “spots left”)
    - flexible:
      - show preferred date picker (simple date input is OK for MVP)
      - optionally allow a “date range” input later, but keep MVP simple

  - Additional booking form fields (UI fields)
    - Max People / Party Size (number input; required)
    - Tour preference (optional): group type/notes already covered by “notes”

- Public endpoint:
  - `POST /api/v1/enquiries`
  - Request fields:
    - traveler name, email, phone
    - package or departure reference (fixed) OR preferred dates (flexible)
    - party size (from UI)
    - notes/message
  - Enquiry creates a record with initial status (e.g. `NEW`)
- Admin/staff visibility (API side):
  - `GET /api/v1/admin/enquiries` (list)
  - `PATCH /api/v1/admin/enquiries/:id` (status update)
  - Optional: add internal notes
- Notifications:
  - Email to staff (new enquiry)
  - Email acknowledgement to guest (received)

## Acceptance criteria
- Submitting the booking modal sends data to the API (no mock).
- Staff receives an email for a new enquiry (provider can be configured later in deployment).
- Guest receives an acknowledgement email.

## Delivery note
R3 is complete for this cycle: booking modal and footer quick enquiry submit to `POST /api/v1/enquiries`, guest/staff email notifications are wired with branded HTML templates, and admin enquiries now support status updates, delete action, pagination, filters/search, and localStorage-backed filter persistence.
