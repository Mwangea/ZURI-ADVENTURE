# R3 - Enquiries + email notifications

## Goal
Let travelers submit enquiries/booking requests and notify staff and the guest.

## Scope
- Public endpoint:
  - `POST /api/v1/enquiries`
  - Request fields:
    - traveler name, email, phone
    - package or departure reference (fixed) OR preferred dates (flexible)
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
