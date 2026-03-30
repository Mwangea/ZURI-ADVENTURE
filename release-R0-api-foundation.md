# R0 - API foundation (Express)

## Goal
Get the backend running locally with a clean `/api/v1` structure, secure defaults, and a health endpoint.

## Scope
- Create `server/` folder with an Express app.
- Add `/health` endpoint returning basic uptime/status.
- Add `/api/v1` router shell with placeholder routes (no business logic yet).
- Choose and implement CORS policy for **same-domain** frontend usage.
- Add security middleware:
  - JSON body parsing
  - request size limits
  - security headers (Helmet)
  - basic error handler returning consistent JSON
- Add request logging for development (can be minimal).

## Acceptance criteria
- `GET /health` works.
- `GET /api/v1/` (or `/api/v1/health`) returns valid JSON.
- No admin endpoints are exposed without auth (even if empty).
- Frontend can later call `/api/v1/...` as same-origin.

## Deliverables
- Express entry file (e.g. `server/src/index.ts`).
- Router structure (e.g. `server/src/routes/apiV1.ts`).
- Documented environment variables (`.env.example` in later release).
