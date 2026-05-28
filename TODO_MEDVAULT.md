# MedVault TODO And Scan Findings

Last scanned: 2026-05-28

This file records what appears complete, missing, risky, or worth improving after a read-only project scan. It does not represent implemented fixes.

## Completed Parts

- npm workspace monorepo with `apps/api`, `apps/web`, `apps/worker`, and `packages/shared`.
- Express API service with TypeScript, modular routes/controllers/services/models, validation, and centralized error handling.
- MongoDB/Mongoose models for users, refresh tokens, patient profiles, timeline events, medications, documents, share links, consents, and notifications.
- Auth flows for register, login, logout, current user, refresh-token rotation, httpOnly cookies, password hashing, and role/permission helpers.
- Patient profile CRUD with owner-scoped access.
- Timeline event CRUD with tags, categories, filters, and FHIR-friendly metadata.
- Medication CRUD with schedules, reminders payloads, and adherence logs.
- Document metadata/upload flow with local storage adapter, checksum tracking, MIME allowlist, and size limits.
- Public document share links with hashed tokens, expiry, access limits, and revocation.
- Consent grant creation and withdrawal flow.
- Notifications API plus BullMQ publishing and worker-side email processing.
- React/Vite frontend with auth gate, dashboard, timeline, medication forms, documents, notifications, and consent/security UI.
- Centralized frontend API client with credentialed requests and refresh retry.
- Observability endpoints for health, liveness, readiness, and Prometheus metrics.
- Docker Compose, production Compose, service Dockerfiles, Render config, Vercel config, and GitHub Actions CI.
- Vitest-based tests across API, web, worker, and shared package.
- Simple Codex agent setup with four readable read-only scan agents and `max_threads = 2`, `max_depth = 1`.

## Missing Parts

- No lint or format tooling was found.
- No ESLint, Prettier, or Biome config was found.
- No coverage thresholds were found.
- No dependency/security scanning gate was found.
- No OpenAPI/Swagger spec or Postman collection was found.
- No database migration or seed workflow was found.
- No full audit-log model, write trail, or audit route was found.
- No explicit CSRF strategy was found for cookie-based auth.
- No API rate limiting was found for auth, refresh, public share-token, or upload endpoints.
- No production-ready S3/Cloudinary adapter was found, though provider names are reserved.
- No medication reminder queue/worker processing was found beyond reminder payload generation.
- No active patient profile selector was found in the frontend.
- No dedicated Medications page was found; the nav section appears to fall through to dashboard content.
- No production ops docs were found for backups, restore drills, secret rotation, TLS/proxy assumptions, or log/metric ingestion.

## Broken Or Problematic Parts

- `.gitignore` appears to contain a suspicious `uploadscookies.txt` entry, so `uploads` may not be ignored as intended.
- `apps/web/tsconfig.tsbuildinfo` is tracked even though `*.tsbuildinfo` is now ignored.
- Timeline, documents, and consent frontend pages can silently fall back to demo data when live data is missing, which can mask backend failures.
- The dashboard `Unread alerts` stat is hardcoded to `0`.
- Notification unread count appears tied to the current fetched page/filter rather than a global unread count.
- `DocumentShareLink` access count handling may be non-atomic, allowing concurrent requests to exceed `maxAccessCount`.
- Document API responses may expose local absolute `storageUrl`; a controlled download/stream endpoint would be safer.
- Consent grants are stored but not fully enforced against read/download access.
- Family/clinician role permissions exist, but services largely filter by `ownerId = auth.userId`, so delegated access is not fully modeled.
- `/metrics` appears publicly exposed unless protected by deployment infrastructure.
- Large frontend files, especially `apps/web/src/App.tsx` and `apps/web/src/features/documents/DocumentsPage.tsx`, are carrying several responsibilities.
- Existing API coverage appears low in local coverage artifacts, especially branch coverage.

## High-Priority Fixes

1. Add CSRF protection or a clearly documented CSRF strategy for cookie-auth flows.
2. Add API rate limiting for auth, refresh, public share links, and uploads.
3. Protect or disable public `/metrics` in production.
4. Fix `.gitignore` upload ignore typo and clean generated/tracked artifacts intentionally.
5. Add lint/format tooling and CI gates.
6. Add dependency and container security scanning to CI.
7. Replace direct local document URL exposure with controlled download/stream endpoints.
8. Make public share-link access count enforcement atomic.
9. Decide and implement consent enforcement for sensitive reads/downloads.
10. Add coverage thresholds and expand backend tests around auth, upload, share links, and access control.

## Medium-Priority Improvements

- Add OpenAPI documentation and/or a Postman collection.
- Add seed scripts or demo data setup.
- Add active patient profile selection in the frontend.
- Add a dedicated Medications page route/view.
- Replace silent demo-data fallback with explicit empty/error/loading states.
- Add global notification unread count behavior.
- Implement durable object storage for production uploads.
- Add medication reminder queue scheduling and worker processing.
- Add audit-log persistence for sensitive actions.
- Split large frontend components into focused panels/forms/lists/details.
- Add mobile navigation and responsive behavior tests.
- Add tests for document upload/share/revoke, consent create/withdraw, and notification archive.
- Add production ops documentation for backups, restore drills, secrets, TLS, and monitoring.

## Suggested Next Implementation Order

1. Clean project hygiene: fix `.gitignore`, decide what to do with tracked build artifacts, add lint/format tooling, and add CI gates.
2. Secure the API surface: add rate limiting, CSRF strategy, metrics protection, and safer document download behavior.
3. Strengthen access control: model delegated profile access, enforce consent where required, and add audit logging.
4. Improve critical backend correctness: atomic share-link access limits, upload cleanup, upload content validation, and expanded tests.
5. Improve frontend truthfulness: remove silent demo fallbacks, add explicit loading/error/empty states, and add an active profile selector.
6. Complete user workflows: dedicated medications view, global unread count, medication reminder scheduling, and production object storage.
7. Improve production readiness: dependency/container scans, backup/restore docs, secret rotation docs, TLS/proxy guidance, and monitoring/log ingestion.

## Commands To Recheck Later

```powershell
npm run typecheck
npm run test
npm run build
npm run verify
npm run test:coverage
```
