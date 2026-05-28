# MedVault Current Status

Last scanned: 2026-05-28

This file explains what is complete, partial, missing, and likely causing deployment problems.

## What Is Already Completed

- Monorepo setup with npm workspaces.
- Frontend React app in `apps/web`.
- Backend Express API in `apps/api`.
- Background worker in `apps/worker`.
- Shared TypeScript package in `packages/shared`.
- MongoDB/Mongoose models.
- User auth with register, login, logout, refresh tokens, and httpOnly cookies.
- Patient profile CRUD.
- Timeline event CRUD.
- Medication CRUD and adherence logs.
- Document upload metadata and local storage.
- Secure document share links.
- Consent create/withdraw flow.
- Notifications API and worker-side email processing.
- Health, liveness, readiness, and metrics endpoints.
- Docker files and Docker Compose files.
- Render and Vercel deployment config files.
- Tests using Vitest.
- Codex simple agent setup in `.codex`.

## What Is Partially Completed

- Document storage supports local storage, but S3/Cloudinary names exist without full adapters.
- Medication reminders exist as data/jobs helpers, but full reminder scheduling/worker flow does not appear complete.
- Consent records exist, but consent enforcement across document/timeline reads is not fully modeled.
- Family/clinician roles exist, but delegated access is not fully modeled in services.
- Frontend has screens for major features, but some pages use demo fallback data.
- Notifications exist, but dashboard unread count appears incomplete/hardcoded.
- Deployment config exists, but Vercel/Render settings must match monorepo requirements.

## What Is Missing

- Explicit CSRF protection for cookie auth.
- API rate limiting.
- Lint/format tooling such as ESLint, Prettier, or Biome.
- Coverage thresholds.
- Dependency/security scanning in CI.
- OpenAPI/Swagger documentation.
- Database seed script.
- Database migration strategy.
- Full audit log model and API.
- Production object storage adapter.
- Active patient profile selector in the frontend.
- Dedicated Medications page.
- Better frontend loading/error/empty states.
- Production ops notes for backups, restore, secrets, logs, and metrics.

## What Looks Broken Or Risky

- Vercel can fail if it runs `npm ci` from `apps/web` instead of the repo root.
- Render can fail if it runs build commands from `apps/api` instead of the repo root.
- The app requires `package-lock.json` at the root for `npm ci`.
- Backend exits if required env variables are missing or invalid.
- `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` must be at least 32 characters.
- `CLIENT_ORIGIN` must exactly match the frontend URL for browser auth to work.
- `VITE_API_URL` must point frontend to the backend API.
- `AUTH_COOKIE_SAME_SITE=none` requires `AUTH_COOKIE_SECURE=true` and HTTPS.
- Public `/metrics` may be visible unless protected by deployment/network settings.
- API has no rate limiting yet.
- Cookie auth has no explicit CSRF strategy yet.
- Share-link access counting may need atomic enforcement.
- Local upload storage needs persistent storage in production.
- `.gitignore` appears to have a suspicious uploads ignore typo from earlier scan notes.

## Why Vercel Deployment May Be Failing

Most likely reason:

Vercel may be using `apps/web` as the Root Directory.

This project does not have:

```text
apps/web/package-lock.json
```

It has:

```text
package-lock.json
```

So `npm ci` must run from:

```text
D:\MedVault
```

not:

```text
D:\MedVault\apps\web
```

Correct Vercel settings:

| Setting | Value |
| --- | --- |
| Framework | Vite |
| Root Directory | repository root / blank |
| Install Command | `npm ci` |
| Build Command | `npm run build --workspace @medvault/shared && npm run build --workspace @medvault/web` |
| Output Directory | `apps/web/dist` |

Vercel also needs:

```text
VITE_API_URL=https://your-render-api-url/api/v1
```

## Why Render Backend May Be Failing

Possible reasons:

1. Render root directory is wrong.

   The `render.yaml` build command expects the repository root because it uses npm workspaces and the root lockfile.

2. Required environment variables are missing.

   The API validates env vars on startup. If these are missing, the API can exit:

   - `CLIENT_ORIGIN`
   - `MONGODB_URI`
   - `REDIS_URL`
   - `ACCESS_TOKEN_SECRET`
   - `REFRESH_TOKEN_SECRET`

3. Secrets are too short.

   `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` must be at least 32 characters.

4. MongoDB or Redis connection string is wrong.

   Bad `MONGODB_URI` or `REDIS_URL` can make the app unhealthy or not ready.

5. MongoDB Atlas network access blocks Render.

   If Atlas does not allow Render outbound traffic, the API cannot connect.

6. Cookie/CORS settings do not match.

   `CLIENT_ORIGIN` must match the Vercel frontend URL.

7. Upload disk is missing or not mounted.

   The current `render.yaml` expects local uploads at `/app/uploads` with a persistent disk.

## What Should Be Fixed First

1. Fix Vercel project settings so it builds from the repo root.
2. Check Render project settings so API/worker build from the repo root.
3. Confirm Vercel `VITE_API_URL` points to Render API plus `/api/v1`.
4. Confirm Render API `CLIENT_ORIGIN` matches the Vercel URL.
5. Confirm Render env vars are all present and secrets are long enough.
6. Confirm MongoDB Atlas and Upstash Redis URLs work from Render.
7. Run local verification commands before redeploying.

## What Should Be Fixed Later

- Add rate limiting.
- Add CSRF strategy.
- Protect `/metrics` in production.
- Add lint/format tooling.
- Add security/dependency scanning.
- Add OpenAPI documentation.
- Add audit logging.
- Add production object storage.
- Improve frontend empty/error states.
- Add more tests around auth, documents, sharing, consent, notifications, and deployment behavior.
