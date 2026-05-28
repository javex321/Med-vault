# MedVault Codemap

Last scanned: 2026-05-28

This file is a simple map of the important folders and files in MedVault.

## Important Folders

| Folder | What it does |
| --- | --- |
| `apps/api` | Backend Express API. This handles login, health data, uploads, database writes, and API responses. |
| `apps/api/src/modules` | Main backend feature modules. Each feature usually has routes, controller, service, model, schema, and mapper files. |
| `apps/web` | Frontend React/Vite app. This is the user interface opened in the browser. |
| `apps/web/src/features` | Frontend feature screens and forms, such as auth, timeline, documents, and consent. |
| `apps/worker` | Background worker for email/notification jobs using BullMQ and Redis. |
| `packages/shared` | Shared TypeScript types used by frontend, backend, and worker. |
| `docs` | Extra documentation, mainly deployment notes. |
| `.github/workflows` | GitHub Actions CI workflow. |
| `.codex` | Codex agent setup and config files. |

## Important Root Files

| File | What it does |
| --- | --- |
| `package.json` | Defines the npm workspace monorepo and main commands. |
| `package-lock.json` | Locks exact npm dependency versions. Required for `npm ci`. |
| `tsconfig.base.json` | Shared strict TypeScript settings. |
| `.env.example` | Example local environment variables. |
| `.env.production.example` | Example production environment variables. |
| `README.md` | Main project explanation and quick run instructions. |
| `docker-compose.yml` | Local MongoDB and Redis containers. |
| `docker-compose.prod.yml` | Production-style Docker setup for web, API, worker, MongoDB, and Redis. |
| `render.yaml` | Render blueprint for API and worker deployment. |
| `vercel.json` | Vercel frontend build configuration. |

## Backend Map

Backend location: `apps/api`

| File or folder | What it does |
| --- | --- |
| `apps/api/src/server.ts` | Starts the backend server and connects MongoDB/Redis. |
| `apps/api/src/app.ts` | Creates the Express app, middleware, routes, health checks, and errors. |
| `apps/api/src/routes/index.ts` | Connects all `/api/v1` routes. |
| `apps/api/src/config/env.ts` | Reads and validates backend environment variables. |
| `apps/api/src/config/db.ts` | MongoDB connection helper. |
| `apps/api/src/config/redis.ts` | Redis connection helper. |
| `apps/api/src/middleware` | Request validation, request IDs, 404 handling, and error handling. |
| `apps/api/src/utils` | API response helpers, async handler, and logger. |

## Backend Modules

| Module | Main job |
| --- | --- |
| `auth` | Register, login, logout, current user, refresh tokens, cookies, password hashing, permissions. |
| `patient-profile` | Patient profile create/read/update/delete. |
| `timeline-event` | Medical timeline events such as visits, diagnoses, procedures, labs, and notes. |
| `medication` | Medications, schedules, reminders data, and adherence logs. |
| `document` | Medical document upload, metadata, storage, and filtering. |
| `sharing` | Secure public document share links. |
| `consent` | Consent grants, scopes, expiry, and withdrawal. |
| `notification` | In-app/email notification records and queue publishing. |
| `health` | `/health` endpoint. |
| `observability` | `/live`, `/ready`, and `/metrics` endpoints. |

## Backend Routes Map

Base API path: `/api/v1`

| Feature | Routes |
| --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` |
| Health | `GET /health` |
| Profiles | `GET /patient-profiles`, `POST /patient-profiles`, `GET /patient-profiles/:profileId`, `PATCH /patient-profiles/:profileId`, `DELETE /patient-profiles/:profileId` |
| Timeline | `GET /patient-profiles/:profileId/timeline-events`, `POST /patient-profiles/:profileId/timeline-events`, `GET/PATCH/DELETE /patient-profiles/:profileId/timeline-events/:eventId` |
| Medications | `GET /patient-profiles/:profileId/medications`, `POST /patient-profiles/:profileId/medications`, `GET/PATCH/DELETE /patient-profiles/:profileId/medications/:medicationId` |
| Medication adherence | `GET /patient-profiles/:profileId/medications/:medicationId/adherence`, `POST /patient-profiles/:profileId/medications/:medicationId/adherence` |
| Documents | `GET /patient-profiles/:profileId/documents`, `POST /patient-profiles/:profileId/documents`, `GET/PATCH/DELETE /patient-profiles/:profileId/documents/:documentId` |
| Share links | `GET /patient-profiles/:profileId/documents/:documentId/share-links`, `POST /patient-profiles/:profileId/documents/:documentId/share-links`, `PATCH /patient-profiles/:profileId/documents/:documentId/share-links/:shareLinkId/revoke` |
| Public share link | `GET /share-links/:token` |
| Consent | `GET /patient-profiles/:profileId/consents`, `POST /patient-profiles/:profileId/consents`, `PATCH /patient-profiles/:profileId/consents/:consentId/withdraw` |
| Notifications | `GET /notifications`, `POST /notifications`, `PATCH /notifications/:notificationId/read`, `DELETE /notifications/:notificationId` |
| Observability | `GET /live`, `GET /ready`, `GET /metrics` |

## Frontend Map

Frontend location: `apps/web`

| File or folder | What it does |
| --- | --- |
| `apps/web/src/main.tsx` | Starts the React app. |
| `apps/web/src/App.tsx` | Main app shell, login gate, dashboard, navigation, and many dashboard actions. |
| `apps/web/src/lib/api.ts` | Central frontend API client. Talks to backend using `VITE_API_URL`. |
| `apps/web/src/styles.css` | Tailwind/global styles. |
| `apps/web/src/test/setup.ts` | Frontend test setup. |
| `apps/web/src/App.test.tsx` | Frontend integration-style tests. |

## Frontend Pages And Components

| Area | File | What it does |
| --- | --- | --- |
| Login/register | `apps/web/src/features/auth/AuthPage.tsx` | User login and registration forms. |
| Dashboard/app shell | `apps/web/src/App.tsx` | Main authenticated UI, overview cards, navigation, profile/timeline/medication actions. |
| Patient profile form | `apps/web/src/features/patient-profile/PatientProfileForm.tsx` | Create/edit patient profile form. |
| Timeline page | `apps/web/src/features/timeline/TimelinePage.tsx` | Timeline list, search, filters, and detail view. |
| Timeline form | `apps/web/src/features/timeline/TimelineEventForm.tsx` | Add/edit timeline events. |
| Medication form | `apps/web/src/features/medications/MedicationForm.tsx` | Add/edit medication details and schedule. |
| Documents page | `apps/web/src/features/documents/DocumentsPage.tsx` | Upload, search, filter, view documents, create/revoke share links. |
| Notifications page | `apps/web/src/features/notifications/NotificationsPage.tsx` | List, filter, mark read, and archive notifications. |
| Consent/security page | `apps/web/src/features/consent/ConsentPage.tsx` | Create and withdraw consent grants. |
| Demo timeline data | `apps/web/src/features/timeline/mockTimeline.ts` | Demo fallback timeline data. |
| Demo document data | `apps/web/src/features/documents/mockDocuments.ts` | Demo fallback document data. |
| Demo consent data | `apps/web/src/features/consent/mockConsents.ts` | Demo fallback consent data. |

## Frontend API Calls

The frontend API client is `apps/web/src/lib/api.ts`.

| Feature | Backend endpoint family |
| --- | --- |
| Auth | `/auth/me`, `/auth/login`, `/auth/register`, `/auth/logout`, `/auth/refresh` |
| Profiles | `/patient-profiles` |
| Timeline | `/patient-profiles/:profileId/timeline-events` |
| Medications | `/patient-profiles/:profileId/medications` |
| Documents | `/patient-profiles/:profileId/documents` |
| Share links | `/patient-profiles/:profileId/documents/:documentId/share-links` |
| Consent | `/patient-profiles/:profileId/consents` |
| Notifications | `/notifications` |
| Health | `/health` |

## Database Models Map

Database: MongoDB through Mongoose.

| Model | File | What it stores |
| --- | --- | --- |
| `User` | `apps/api/src/modules/auth/user.model.ts` | User account, email, name, roles, password hash, status. |
| `RefreshToken` | `apps/api/src/modules/auth/refresh-token.model.ts` | Refresh token hashes, expiry, token family, revocation. |
| `PatientProfile` | `apps/api/src/modules/patient-profile/patient-profile.model.ts` | Patient demographic/profile data. |
| `TimelineEvent` | `apps/api/src/modules/timeline-event/timeline-event.model.ts` | Medical timeline events. |
| `Medication` | `apps/api/src/modules/medication/medication.model.ts` | Medications, schedules, reminders, adherence logs. |
| `MedicalDocument` | `apps/api/src/modules/document/document.model.ts` | Uploaded document metadata and storage info. |
| `DocumentShareLink` | `apps/api/src/modules/sharing/share-link.model.ts` | Hashed public share tokens, expiry, access limits, revocation. |
| `ConsentGrant` | `apps/api/src/modules/consent/consent.model.ts` | Consent recipient, purpose, scopes, status, expiry, withdrawal. |
| `Notification` | `apps/api/src/modules/notification/notification.model.ts` | In-app/email notification records. |

## Shared Package Map

Shared package location: `packages/shared`

| File | What it does |
| --- | --- |
| `packages/shared/src/index.ts` | Shared TypeScript types for API responses, users, profiles, timeline events, medications, documents, share links, consents, notifications, and email jobs. |
| `packages/shared/src/index.test.ts` | Basic shared package tests. |
| `packages/shared/package.json` | Build/typecheck/test commands for the shared package. |
| `packages/shared/tsconfig.json` | Shared package TypeScript config. |
| `packages/shared/tsconfig.build.json` | Build-specific TypeScript config. |

## Worker Map

Worker location: `apps/worker`

| File | What it does |
| --- | --- |
| `apps/worker/src/index.ts` | Starts the background worker. |
| `apps/worker/src/config/env.ts` | Reads worker environment variables. |
| `apps/worker/src/config/db.ts` | Connects worker to MongoDB. |
| `apps/worker/src/modules/email/email.processor.ts` | Processes email jobs. |
| `apps/worker/src/modules/email/email.service.ts` | Sends email through SMTP or JSON transport. |
| `apps/worker/src/modules/notification/notification.model.ts` | Notification model used by worker. |

## Config Files Map

| File | What it does |
| --- | --- |
| `apps/api/tsconfig.json` | API TypeScript config. |
| `apps/api/tsconfig.build.json` | API production build config. |
| `apps/web/tsconfig.json` | Web TypeScript config. |
| `apps/worker/tsconfig.json` | Worker TypeScript config. |
| `apps/worker/tsconfig.build.json` | Worker production build config. |
| `apps/api/vitest.config.ts` | API test config. |
| `apps/web/vitest.config.ts` | Web test config. |
| `apps/worker/vitest.config.ts` | Worker test config. |
| `packages/shared/vitest.config.ts` | Shared package test config. |
| `apps/api/Dockerfile` | Builds API Docker image. |
| `apps/web/Dockerfile` | Builds frontend/Nginx Docker image. |
| `apps/worker/Dockerfile` | Builds worker Docker image. |
| `apps/web/nginx.conf` | Nginx config for Docker frontend and `/api` proxy. |
