# MedVault Deployment Guide

This guide is for the recommended cloud deployment:

- Frontend: Vercel, serving `apps/web`
- Backend API: Render web service, serving `apps/api`
- Background worker: Render worker service, serving `apps/worker`
- Database: MongoDB Atlas
- Queue/cache: Upstash Redis

MedVault is an npm workspace monorepo. Keep all cloud install and build commands running from the repository root, because the root contains `package.json` and `package-lock.json`.

Do not set Vercel or Render to build from `apps/web`, `apps/api`, or `apps/worker` directly.

## 1. Confirm The Monorepo Shape

Repository root:

```text
D:\MedVault
```

Workspace folders:

```text
apps/api
apps/web
apps/worker
packages/shared
```

Root files required by deployment:

```text
package.json
package-lock.json
vercel.json
render.yaml
```

## 2. Vercel Frontend Settings

Create or update the Vercel project for the frontend with these settings:

| Setting | Value |
| --- | --- |
| Framework Preset | `Vite` |
| Root Directory | repository root / blank |
| Install Command | `npm ci` |
| Build Command | `npm run build --workspace @medvault/shared && npm run build --workspace @medvault/web` |
| Output Directory | `apps/web/dist` |

Required Vercel environment variable:

```env
VITE_API_URL=https://your-render-api-url/api/v1
```

Important:

- Do not set Root Directory to `apps/web`.
- There is no `apps/web/package-lock.json`.
- `npm ci` must run beside the root `package-lock.json`.
- The root `vercel.json` already stores the install command, build command, output directory, and frontend route rewrite.

## 3. Render API Settings

Use the root `render.yaml` Blueprint when possible.

Manual API settings:

| Setting | Value |
| --- | --- |
| Service Type | Web Service |
| Runtime | Node |
| Root Directory | repository root / blank |
| Build Command | `npm ci && npm run build --workspace @medvault/shared && npm run build --workspace @medvault/api` |
| Start Command | `npm run start --workspace @medvault/api` |
| Health Check Path | `/live` |

Required Render API environment variables:

```env
NODE_ENV=production
CLIENT_ORIGIN=https://your-vercel-app.vercel.app
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster-host>/medvault?retryWrites=true&w=majority&appName=MedVault
REDIS_URL=rediss://default:<password>@<upstash-host>:6379
ACCESS_TOKEN_SECRET=<64-plus-character-random-secret>
REFRESH_TOKEN_SECRET=<64-plus-character-random-secret>
ACCESS_TOKEN_TTL_SECONDS=900
REFRESH_TOKEN_TTL_SECONDS=2592000
JWT_ISSUER=medvault-api
JWT_AUDIENCE=medvault-web
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAME_SITE=none
STORAGE_PROVIDER=local
LOCAL_UPLOAD_DIR=/app/uploads
MAX_DOCUMENT_UPLOAD_BYTES=10485760
EMAIL_QUEUE_NAME=medvault-email
```

Notes:

- Render provides `PORT` automatically. The API also supports `API_PORT`, but it is not required on Render.
- Use `AUTH_COOKIE_SECURE=true` and `AUTH_COOKIE_SAME_SITE=none` because Vercel and Render are different HTTPS domains.
- Attach a Render persistent disk at `/app/uploads` while the app uses local document storage.

## 4. Render Worker Settings

Use the root `render.yaml` Blueprint when possible.

Manual worker settings:

| Setting | Value |
| --- | --- |
| Service Type | Background Worker |
| Runtime | Node |
| Root Directory | repository root / blank |
| Build Command | `npm ci && npm run build --workspace @medvault/shared && npm run build --workspace @medvault/worker` |
| Start Command | `npm run start --workspace @medvault/worker` |

Required Render worker environment variables:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster-host>/medvault?retryWrites=true&w=majority&appName=MedVault
REDIS_URL=rediss://default:<password>@<upstash-host>:6379
EMAIL_QUEUE_NAME=medvault-email
EMAIL_FROM="MedVault <no-reply@yourdomain.com>"
```

Optional real email variables:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<smtp-user>
SMTP_PASS=<smtp-password>
```

If SMTP is not configured, the worker uses a safe JSON transport for demos and does not send real email.

## 5. MongoDB Atlas

1. Create a MongoDB Atlas cluster.
2. Create a database user with read/write access.
3. Add network access for Render.
4. Copy the driver connection string.
5. Make sure the database name is included before the query string.

Example shape:

```text
mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/medvault?retryWrites=true&w=majority&appName=MedVault
```

Set this value as `MONGODB_URI` in both Render API and Render worker.

## 6. Upstash Redis

1. Create an Upstash Redis database.
2. Copy the Redis TCP URL, not the REST URL.
3. Use the `rediss://` URL.

Example shape:

```text
rediss://default:<password>@your-db.upstash.io:6379
```

Set this value as `REDIS_URL` in both Render API and Render worker.

## 7. Deployment Order

1. Create MongoDB Atlas database.
2. Create Upstash Redis database.
3. Deploy Render API.
4. Deploy Render worker.
5. Copy the Render API URL.
6. Set Vercel `VITE_API_URL` to the Render API URL plus `/api/v1`.
7. Deploy Vercel frontend.
8. Set Render API `CLIENT_ORIGIN` to the final Vercel frontend URL.
9. Redeploy Render API after setting `CLIENT_ORIGIN`.

## 8. Smoke Tests After Deployment

Replace the URLs with your real deployed URLs.

API liveness:

```powershell
curl.exe https://your-render-api-url/live
```

API readiness:

```powershell
curl.exe https://your-render-api-url/ready
```

Versioned API health:

```powershell
curl.exe https://your-render-api-url/api/v1/health
```

Frontend:

```text
https://your-vercel-app.vercel.app
```

Browser test:

1. Open the Vercel URL.
2. Register a test account.
3. Create a patient profile.
4. Add one timeline event.
5. Add one medication.

## 9. Common Deployment Errors

### Vercel `npm ci` fails

Most likely cause:

Vercel Root Directory is set to `apps/web`.

Fix:

Set Root Directory to repository root / blank.

### Vercel builds but frontend cannot call API

Most likely causes:

- `VITE_API_URL` is missing.
- `VITE_API_URL` does not end with `/api/v1`.
- Render API is not live.
- Render API `CLIENT_ORIGIN` does not match the Vercel URL.

### Render API starts but login fails in browser

Check:

- `CLIENT_ORIGIN=https://your-vercel-app.vercel.app`
- `AUTH_COOKIE_SECURE=true`
- `AUTH_COOKIE_SAME_SITE=none`
- Vercel `VITE_API_URL=https://your-render-api-url/api/v1`

### Render API is not ready

Check:

- `MONGODB_URI`
- `REDIS_URL`
- MongoDB Atlas network access
- Upstash Redis TCP URL

### Uploaded documents disappear

The current production storage adapter is local disk. On Render, attach a persistent disk at:

```text
/app/uploads
```

## 10. Pre-Deployment Verification

Run from the repository root:

```powershell
npm run typecheck
npm run build
npm run verify
```

These commands should pass before redeploying.
