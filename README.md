# MedVault - Personal Health Timeline

MedVault is an advanced MERN health-tech portfolio project for managing personal medical history in a secure timeline. It demonstrates production-style full-stack engineering: typed React forms, protected Express APIs, MongoDB persistence, Redis/BullMQ background jobs, secure cookie auth, observability, tests, and deployment configuration.

## Why This Project Is Resume-Ready

- It is not a basic CRUD clone. It models real healthcare workflows: patient profiles, medical events, medications, documents, share links, consent, notifications, and audit-friendly logs.
- It uses senior-level architecture: monorepo workspaces, shared TypeScript contracts, service/controller/model separation, validation, error envelopes, request IDs, RBAC-style permissions, and profile-scoped authorization.
- It includes realistic infrastructure pieces: MongoDB Atlas or local MongoDB, Upstash Redis or local Redis, BullMQ worker separation, Docker Compose, readiness/liveness probes, Prometheus metrics, and CI-ready scripts.

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, TanStack Query, React Hook Form, Zod
- Backend: Node.js, Express, TypeScript, Mongoose
- Database: MongoDB or MongoDB Atlas
- Cache/queues: Redis or Upstash Redis, BullMQ
- Auth/security: Argon2id, JWT access tokens, refresh-token rotation, httpOnly cookies, Helmet, CORS, RBAC-style permissions
- Files: Multipart uploads with local/S3-style storage abstraction
- Worker: Separate email notification worker
- Testing: Vitest, React Testing Library, Supertest
- Observability: Structured logs, request IDs, `/live`, `/ready`, `/metrics`
- DevOps: Docker, Docker Compose, production Dockerfiles, GitHub Actions workflow

## Completed Feature Set

- Auth: register, login, logout, current user, refresh-token rotation, automatic frontend refresh retry
- Patient profiles: create, edit, archive/delete, owner-scoped access
- Timeline events: create, edit, archive/delete, filters, tags, medical categories, FHIR-friendly metadata
- Medications: create, edit, archive/delete, dosage schedules, reminders, adherence logs
- Documents: upload metadata, local storage adapter, checksum tracking, search/filter UI
- Sharing: hashed public share tokens, expiry, access limits, revocation
- Consent: legal basis, scopes, expiry, withdrawal flow
- Notifications: in-app/email records, BullMQ publishing, worker-side email processing
- Observability: health, liveness, readiness, Prometheus metrics
- Deployment: dev Docker Compose, production Compose, Nginx web image, API/worker separation

## Monorepo Structure

```text
MedVault/
  apps/
    api/        Express API service
    web/        React/Vite frontend
    worker/     BullMQ background worker
  packages/
    shared/     Shared TypeScript contracts
  docs/         Deployment notes
```

## Local Development With MongoDB Atlas + Upstash Redis

Use this path if you do not want Docker running locally.

1. Install dependencies:

```powershell
cd D:\MedVault
npm install
```

2. Create `.env` from the example:

```powershell
copy .env.example .env
```

3. In `.env`, set:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-host>/medvault?retryWrites=true&w=majority&appName=<appName>
REDIS_URL=rediss://default:<password>@<upstash-host>:6379
CLIENT_ORIGIN=http://localhost:5173
VITE_API_URL=http://localhost:4000/api/v1
AUTH_COOKIE_SECURE=false
```

4. Start the API:

```powershell
npm run dev:api
```

Expected API logs:

```text
MedVault API is running
MongoDB connected
Redis connected
```

5. Start the frontend in a second terminal:

```powershell
npm run dev:web
```

6. Open the frontend URL printed by Vite:

```text
http://localhost:5173/
```

If Vite says port `5173` is busy and uses `5174`, open the exact URL shown in the terminal.

## Optional Docker Development

Use Docker if you want local MongoDB and Redis containers.

```powershell
cd D:\MedVault
npm run docker:up
npm run dev:api
npm run dev:worker
npm run dev:web
```

Stop local containers:

```powershell
npm run docker:down
```

## Daily Run Checklist

1. Start API: `npm run dev:api`
2. Start web: `npm run dev:web`
3. Open the Vite URL, usually `http://localhost:5173/`
4. Login or register
5. Create or select a patient profile
6. Test the main flows:
   - Add/edit/delete patient profile
   - Add/edit/delete timeline event
   - Add/edit/delete medication
   - Upload/list documents
   - Create/revoke share links
   - Create/withdraw consent

## Health And Observability

API health:

```powershell
curl.exe http://localhost:4000/api/v1/health
```

Liveness:

```powershell
curl.exe http://localhost:4000/live
```

Readiness:

```powershell
curl.exe http://localhost:4000/ready
```

Prometheus metrics:

```powershell
curl.exe http://localhost:4000/metrics
```

Key metrics include:

- `medvault_http_requests_total`
- `medvault_http_request_duration_seconds`
- Node.js default process/runtime metrics

## Verification Commands

Run the complete verification suite:

```powershell
npm run verify
```

Equivalent expanded commands:

```powershell
npm run typecheck
npm run test
npm run build
```

Workspace-specific checks:

```powershell
npm run typecheck --workspace @medvault/web
npm run test --workspace @medvault/web
npm run build --workspace @medvault/web
npm run typecheck --workspace @medvault/api
```

## Cloud Deployment: Vercel + Render

The recommended cloud deployment is:

- Vercel for `apps/web`
- Render web service for `apps/api`
- Render worker service for `apps/worker`
- MongoDB Atlas for MongoDB
- Upstash Redis for Redis/BullMQ

This is an npm workspace monorepo. Keep Vercel and Render builds pointed at the repository root, not at `apps/web`, `apps/api`, or `apps/worker`.

Vercel settings:

```text
Root Directory: repository root / blank
Install Command: npm ci
Build Command: npm run build --workspace @medvault/shared && npm run build --workspace @medvault/web
Output Directory: apps/web/dist
Environment: VITE_API_URL=https://your-render-api-url/api/v1
```

Render API settings:

```text
Root Directory: repository root / blank
Build Command: npm ci && npm run build --workspace @medvault/shared && npm run build --workspace @medvault/api
Start Command: npm run start --workspace @medvault/api
Health Check Path: /live
```

Render worker settings:

```text
Root Directory: repository root / blank
Build Command: npm ci && npm run build --workspace @medvault/shared && npm run build --workspace @medvault/worker
Start Command: npm run start --workspace @medvault/worker
```

See `docs/deployment.md` for the full step-by-step guide.

## Production Docker Deployment

Docker production config still exists for local/VPS-style deployment. Create a production env file:

```powershell
copy .env.production.example .env.production
```

For Docker on one host, set `VITE_API_URL=/api/v1` and `CLIENT_ORIGIN=http://localhost:8080` or your same-domain HTTPS URL. Edit production secrets, then run:

```powershell
npm run docker:prod:up
```

Open:

```text
http://localhost:8080
```

Logs:

```powershell
npm run docker:prod:logs
```

Stop:

```powershell
npm run docker:prod:down
```

See `docs/deployment.md` for deployment notes.

## Resume Bullets

- Built MedVault, a secure MERN health-records platform using React, TypeScript, Express, MongoDB, Redis, BullMQ, Docker, and shared monorepo contracts.
- Implemented end-to-end authenticated CRUD for patient profiles, medical timeline events, and medication schedules with TanStack Query cache invalidation and React Hook Form/Zod validation.
- Designed secure auth with Argon2id password hashing, JWT access tokens, refresh-token rotation, httpOnly cookies, protected route middleware, and automatic frontend refresh retry.
- Modeled profile-scoped healthcare data with Mongoose schemas, owner/profile authorization checks, soft-archive delete flows, structured error handling, and request IDs.
- Added document vault workflows with multipart upload validation, SHA-256 checksums, metadata search, and local/S3-style storage abstraction.
- Built sharing and consent features with hashed public share tokens, expiry/access limits, revocation, legal basis, granular consent scopes, and withdrawal state.
- Separated API and worker services for notification/email jobs using BullMQ and Redis, with development-safe email transport.
- Added production-oriented observability and DevOps: liveness/readiness probes, Prometheus metrics, Docker Compose, production Dockerfiles, Nginx static hosting, and CI-ready scripts.
- Verified quality with Vitest, React Testing Library, Supertest, TypeScript typechecks, and production builds across the monorepo.

## Demo Talk Track

Use this short explanation in interviews:

```text
MedVault is a secure personal health timeline. A user logs in with httpOnly cookie auth, creates a patient profile, adds timeline events and medications, uploads documents, and controls access through share links and consent records. The API enforces owner/profile scoping, validates every payload with Zod, stores data in MongoDB, uses Redis/BullMQ for background jobs, and exposes readiness and Prometheus metrics for production-style operations.
```

## Security Notes

- Do not commit `.env`.
- Rotate MongoDB Atlas and Upstash credentials if they were pasted into chats, screenshots, or demos.
- Use strong secrets for `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET`.
- Use `AUTH_COOKIE_SECURE=true` only behind HTTPS in production.
- Public share links store token hashes in the database, not plaintext tokens.

## Status

MedVault is complete enough for a senior MERN portfolio demo and resume discussion. Remaining optional extensions could include full OCR, deeper FHIR import/export, offline/PWA sync, and advanced analytics.
