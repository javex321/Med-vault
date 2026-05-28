# MedVault Run Guide

Last scanned: 2026-05-28

This guide explains how to run MedVault locally in a simple way.

## 1. Install Dependencies

From the project root:

```powershell
cd D:\MedVault
npm install
```

If you want to install exactly from the lockfile:

```powershell
npm ci
```

Use `npm ci` mainly in CI/deployment. For local development, `npm install` is usually easier.

## 2. Create Environment File

Copy the example file:

```powershell
copy .env.example .env
```

Then edit `.env`.

Do not commit `.env`.

## 3. Required `.env` Variables

Minimum local variables:

```env
NODE_ENV=development
API_PORT=4000
CLIENT_ORIGIN=http://localhost:5173
VITE_API_URL=http://localhost:4000/api/v1

MONGODB_URI=mongodb://medvault:medvault_password@localhost:27017/medvault?authSource=admin
REDIS_URL=redis://localhost:6379

ACCESS_TOKEN_SECRET=replace_with_at_least_32_characters_access_secret
REFRESH_TOKEN_SECRET=replace_with_at_least_32_characters_refresh_secret
ACCESS_TOKEN_TTL_SECONDS=900
REFRESH_TOKEN_TTL_SECONDS=2592000
JWT_ISSUER=medvault-api
JWT_AUDIENCE=medvault-web
AUTH_COOKIE_SECURE=false
AUTH_COOKIE_SAME_SITE=lax

STORAGE_PROVIDER=local
LOCAL_UPLOAD_DIR=uploads
MAX_DOCUMENT_UPLOAD_BYTES=10485760

EMAIL_QUEUE_NAME=medvault-email
```

If using local Docker MongoDB and Redis, keep the default local URLs from `.env.example`.

If using MongoDB Atlas and Upstash Redis, replace:

```env
MONGODB_URI=...
REDIS_URL=...
```

with your cloud connection strings.

## 4. Start Local MongoDB And Redis With Docker

If you want local MongoDB and Redis:

```powershell
npm run docker:up
```

To stop them:

```powershell
npm run docker:down
```

If you use MongoDB Atlas and Upstash Redis, you do not need local Docker for database/Redis.

## 5. Run Backend Locally

Open a terminal:

```powershell
cd D:\MedVault
npm run dev:api
```

Expected backend URL:

```text
http://localhost:4000
```

Important backend test URLs:

```powershell
curl.exe http://localhost:4000/health
curl.exe http://localhost:4000/live
curl.exe http://localhost:4000/ready
curl.exe http://localhost:4000/metrics
curl.exe http://localhost:4000/api/v1/health
```

If `/ready` says not ready, MongoDB or Redis is probably not connected.

## 6. Run Frontend Locally

Open a second terminal:

```powershell
cd D:\MedVault
npm run dev:web
```

Expected frontend URL:

```text
http://localhost:5173
```

If Vite uses another port, open the URL shown in the terminal.

## 7. Run Backend And Frontend Together

Terminal 1:

```powershell
cd D:\MedVault
npm run docker:up
```

Terminal 2:

```powershell
cd D:\MedVault
npm run dev:api
```

Terminal 3:

```powershell
cd D:\MedVault
npm run dev:web
```

Optional worker terminal:

```powershell
cd D:\MedVault
npm run dev:worker
```

## 8. Test If Backend Is Working

Run:

```powershell
curl.exe http://localhost:4000/live
```

If backend is alive, it should return a successful JSON response.

Run:

```powershell
curl.exe http://localhost:4000/ready
```

If MongoDB and Redis are connected, it should say ready.

Run:

```powershell
curl.exe http://localhost:4000/api/v1/health
```

This checks API health through the versioned API path.

## 9. Test If Frontend Is Working

Open:

```text
http://localhost:5173
```

Then:

1. Register a user.
2. Log in.
3. Create a patient profile.
4. Add a timeline event.
5. Add a medication.
6. Open Documents, Notifications, and Security pages.

## 10. Useful Project Commands

```powershell
npm run dev:api
npm run dev:web
npm run dev:worker
npm run typecheck
npm run test
npm run build
npm run verify
npm run docker:up
npm run docker:down
```

## 11. Common Errors And Simple Solutions

### Error: `npm ci` fails on Vercel

Likely cause:

Vercel is running inside `apps/web`.

Simple fix:

Set Vercel Root Directory to the repository root / blank.

Correct commands:

```text
Install Command: npm ci
Build Command: npm run build --workspace @medvault/shared && npm run build --workspace @medvault/web
Output Directory: apps/web/dist
```

### Error: frontend cannot call backend

Check:

```env
VITE_API_URL=http://localhost:4000/api/v1
```

For Vercel:

```env
VITE_API_URL=https://your-render-api-url/api/v1
```

Also check Render API:

```env
CLIENT_ORIGIN=https://your-vercel-url
```

### Error: backend says invalid environment variables

Check `.env`.

Common missing variables:

- `CLIENT_ORIGIN`
- `MONGODB_URI`
- `REDIS_URL`
- `ACCESS_TOKEN_SECRET`
- `REFRESH_TOKEN_SECRET`

Secrets must be at least 32 characters.

### Error: `/ready` returns not ready

Likely cause:

MongoDB or Redis is not connected.

Simple checks:

- Is Docker running?
- Did you run `npm run docker:up`?
- Is `MONGODB_URI` correct?
- Is `REDIS_URL` correct?

### Error: login works locally but not in production

Check:

- `CLIENT_ORIGIN` matches frontend URL.
- `AUTH_COOKIE_SECURE=true` in HTTPS production.
- `AUTH_COOKIE_SAME_SITE=none` when frontend and backend are on different domains.
- Vercel `VITE_API_URL` points to Render API.

### Error: uploads disappear after deploy

Likely cause:

Local upload storage needs persistent disk in production.

On Render, make sure `/app/uploads` has a persistent disk.

### Error: port already in use

Another process may already use the port.

Try:

- Use the alternate Vite URL shown in terminal.
- Stop the old backend/frontend terminal.
- Restart the terminal.

## 12. Before Deploying

Suggested checks:

```powershell
npm run typecheck
npm run test
npm run build
npm run verify
```

These commands are not destructive, but they can create build or coverage files.
