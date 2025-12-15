# Copilot / AI Agent Instructions — Corosa

Summary
- Hybrid PHP + Node.js app: frontend in `public/`, legacy PHP APIs in `backend/api/*.php`, newer Node services in `backend/server.js` and `backend/server/routes/`.
- Primary DB: MySQL schema at [backend/database/schema.sql](backend/database/schema.sql). Node DB pool: [backend/config/database.js](backend/config/database.js).

Quick start (dev)
- Start WAMP/Apache so `public/` pages are served at `http://localhost` (frontend expects this).
- Start Node API: `cd backend && npm install && node server.js` (server listens on port 3000). See [backend/server.js](backend/server.js#L1).
- CORS: Node server allows origin `http://localhost` by default (see `cors` config in `server.js`).
- DB env vars supported by some routes: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (see [backend/server/routes/driver-registration.js](backend/server/routes/driver-registration.js#L1)).

What to look at first
- Architecture overview: [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) and Node integration notes at [docs/NODEJS_INTEGRATION_GUIDE.md](docs/NODEJS_INTEGRATION_GUIDE.md).
- Node entry: [backend/server.js](backend/server.js#L1) (route mounting, ports, middleware).
- Node route patterns: `backend/server/routes/*.js` (e.g. driver registration), and API-like routers under `backend/api/*/js`.
- Database models/services: `backend/classes/*/js` (e.g. `TripNode.js`, `BookingsNode.js`) — they use `mysql2/promise` and raw SQL queries.
- Legacy PHP endpoints and models: `backend/api/**/*.php` and `backend/classes/**/*.php` — keep compatibility in mind when changing API behavior.

Conventions & gotchas
- Naming: Node model classes use `*Node` (TripNode, BookingsNode) that mirror PHP class responsibilities.
- Mixed-language repo: Don't assume a single stack — frontend talks to PHP or Node depending on feature; check which endpoint is used in `public/js/*` before changing APIs.
- File uploads: driver license images are saved under `backend/assets/driver-licenses/` (see `driver-registration` route). Clean-up and file naming are handled in route code.
- Watch for typos in paths (e.g., `pasenger` folder) when searching for files or adding new routes.
- No test suite currently present — rely on manual curl/Postman tests and add unit tests when adding Node features.

Quick examples
- Get available trips:
  curl "http://localhost:3000/api/trips?action=getAvailableTrips"
- Create a booking (Node route):
  curl -X POST http://localhost:3000/api/bookings -H "Content-Type: application/json" -d '{"passenger_id":1,"start_lat":16.4,"start_long":120.6,"end_lat":16.5,"end_long":120.7}'
- Register driver (uploads base64 image):
  curl -X POST http://localhost:3000/api/driver/register -H "Content-Type: application/json" -d '{"userId":1,"email":"u@e.com","plateNumber":"ABC123","vehicleModel":"V","seatCapacity":4,"driverLicenseBase64":"<base64>","driverLicenseType":"image/jpeg"}'

When editing or adding endpoints
- Prefer/router patterns already used: small focused routers returning JSON with `success` and `message` fields (see `backend/api/*/js` and `backend/server/routes/*`).
- Keep SQL parameterized (existing code uses `?` placeholders with `mysql2/promise`). Follow existing query formatting.
- Update or add docs under `docs/` when behavior or API contracts change, and update `docs/COMPLETE_API_DOCUMENTATION.md`.

PR checklist for AI edits
- Small, focused changes that preserve backward compatibility with PHP APIs unless explicitly migrating.
- Run quick manual smoke tests (start Node server, hit endpoints). Add tests for new Node modules when practical.
- Update docs and mention file paths that changed.

If anything here is unclear or you need more project-specific examples, ask and I'll expand the instructions or add missing examples.
