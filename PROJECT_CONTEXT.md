# MedVault Project Context

Last scanned: 2026-05-28

This document summarizes the repository after a read-only Codex multi-agent scan. It intentionally avoids secret values and records environment files by name/key surface only.

## What MedVault Is

MedVault is a production-style MERN/TypeScript personal health timeline app. It is built around patient profiles, medical timeline events, medications, medical documents, secure document sharing, consent records, notifications, and observability.

The project is structured as a portfolio-grade full-stack health-tech application rather than a simple CRUD demo. It includes typed frontend forms, protected Express APIs, MongoDB persistence, Redis/BullMQ background jobs, cookie-based auth, metrics, tests, Docker, and deployment configuration.

## Tech Stack Detected

- Monorepo: npm workspaces from the root `package.json`.
- Runtime: Node.js `>=20`, npm `>=10`.
- Frontend: React 18, Vite, TypeScript, Tailwind CSS, TanStack Query, React Hook Form, Zod, lucide-react.
- Backend: Express 4, TypeScript, Mongoose, MongoDB, Zod, jose, Argon2, Helmet, CORS, cookie-parser, pino, prom-client.
- Worker: BullMQ, Redis/ioredis, Nodemailer, Mongoose, TypeScript.
- Shared package: local `@medvault/shared` TypeScript contracts.
- Testing: Vitest, React Testing Library, Supertest, jsdom, coverage via V8.
- Deployment/infra: Docker Compose, production Dockerfiles, Nginx frontend image, Render blueprint, Vercel frontend config, GitHub Actions CI.

## Folder Structure

```text
D:\MedVault
  .codex/
    config.toml
    agents/
  .github/workflows/
    ci.yml
  apps/
    api/        Express API service
    web/        React/Vite frontend
    worker/     BullMQ email notification worker
  docs/         Deployment and resume notes
  packages/
    shared/     Shared TypeScript contracts and tests
  package.json
  package-lock.json
  tsconfig.base.json
  docker-compose.yml
  docker-compose.prod.yml
  render.yaml
  vercel.json
```

## Workspace Setup

The root `package.json` is private and defines workspaces:

- `apps/*`
- `packages/*`

Important root scripts:

- `npm run dev:api` starts `@medvault/api`.
- `npm run dev:web` starts `@medvault/web`.
- `npm run dev:worker` starts `@medvault/worker`.
- `npm run typecheck` runs typechecking across workspaces.
- `npm run test` runs workspace tests where present.
- `npm run build` builds all workspaces.
- `npm run verify` runs typecheck, tests, then build.
- `npm run docker:up` / `npm run docker:down` manage local Compose services.
- `npm run docker:prod:up` / `npm run docker:prod:down` manage production Compose.

## Backend Summary

The backend lives in `apps/api` and is a TypeScript Express API.

Important entry points:

- `apps/api/src/server.ts`
- `apps/api/src/app.ts`
- `apps/api/src/routes/index.ts`
- `apps/api/src/config/env.ts`
- `apps/api/src/config/db.ts`
- `apps/api/src/config/redis.ts`

The Express app includes request IDs, Helmet, CORS with credentials, compression, cookie parsing, JSON/urlencoded request limits, pino HTTP logging, Prometheus metrics middleware, and API error handling.

Main backend modules:

- `auth`
- `patient-profile`
- `timeline-event`
- `medication`
- `document`
- `sharing`
- `consent`
- `notification`
- `health`
- `observability`

The versioned API base is `/api/v1`. Observability also exposes unversioned `/live`, `/ready`, and `/metrics`.

## Frontend Summary

The frontend lives in `apps/web` and is a Vite + React + strict TypeScript app.

Important entry points:

- `apps/web/src/main.tsx`
- `apps/web/src/App.tsx`
- `apps/web/src/lib/api.ts`
- `apps/web/src/styles.css`

Navigation is implemented in `App.tsx` using custom state/hash-style section handling rather than React Router. Detected sections are:

- `Overview`
- `Timeline`
- `Medications`
- `Documents`
- `Notifications`
- `Security`

API access is centralized in `apps/web/src/lib/api.ts`. It uses `VITE_API_URL`, sends credentials with requests, supports JSON helpers, supports file uploads, and retries via refresh token flow after a `401`.

Feature folders:

- `features/auth`
- `features/patient-profile`
- `features/timeline`
- `features/medications`
- `features/documents`
- `features/notifications`
- `features/consent`

## Database Summary

The app uses MongoDB through Mongoose. The main API models are:

- `User`
- `RefreshToken`
- `PatientProfile`
- `TimelineEvent`
- `Medication`
- `MedicalDocument`
- `DocumentShareLink`
- `ConsentGrant`
- `Notification`

The data model is owner/profile scoped for most private healthcare data. Several models include indexes, soft archive behavior, validation schemas, and mapper layers for API responses.

Redis is used for BullMQ queues and worker processing.

## Auth And Security Summary

Auth is implemented in `apps/api/src/modules/auth`.

Detected behavior:

- Register/login issue httpOnly access and refresh cookies.
- Refresh token rotation is stored in MongoDB.
- Refresh token reuse or invalid refresh can revoke a token family.
- Access tokens can be read from cookie or Bearer header.
- Password hashing uses Argon2id.
- Routes are protected by `requireAuth` and permission checks from `auth/permissions.ts`.
- Helmet, CORS, request size limits, cookie parser, and log redaction are present.

Important risks noted by scan:

- No explicit CSRF protection was found for cookie-based auth.
- No API rate limiting was found for auth, refresh, public share-token, or upload routes.
- Consent records exist, but consent enforcement against reads/downloads is not fully modeled.
- Family/clinician role permissions exist, but services still largely filter by `ownerId = auth.userId`.
- Public `/metrics` may need production access control.

## Deployment Summary

Deployment and infra files detected:

- `docker-compose.yml`
- `docker-compose.prod.yml`
- `apps/api/Dockerfile`
- `apps/web/Dockerfile`
- `apps/web/nginx.conf`
- `apps/worker/Dockerfile`
- `render.yaml`
- `vercel.json`
- `docs/deployment.md`
- `.github/workflows/ci.yml`

The intended deployment model separates API, web, worker, MongoDB, and Redis concerns. The frontend can be deployed through Vercel or a Docker/Nginx image. Render configuration exists for API/worker-style deployment.

Production gaps noted by scan:

- Local file storage is implemented, while S3/Cloudinary provider names are reserved but not implemented.
- No explicit container image scanning was found.
- Docker images are version-tagged but not digest-pinned.
- Compose files do not fully describe production backups, resource limits, secret management, or TLS/proxy assumptions.

## Testing Summary

Test files detected:

- `apps/api/src/app.test.ts`
- `apps/api/src/modules/consent/consent.status.test.ts`
- `apps/api/src/modules/document/document.storage.test.ts`
- `apps/api/src/modules/sharing/share-link.token.test.ts`
- `apps/web/src/App.test.tsx`
- `apps/worker/src/modules/email/email.service.test.ts`
- `packages/shared/src/index.test.ts`

Current quality scripts:

- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run verify`
- Workspace-specific `test:coverage` scripts

Testing and quality gaps noted by scan:

- No lint or format script was found.
- No ESLint, Prettier, or Biome config was found.
- No coverage thresholds were found.
- API coverage appears low in existing local coverage artifacts.
- No dependency/security scan gate was found.
