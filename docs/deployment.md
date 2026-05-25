# MedVault Deployment Guide

This guide covers both deployment paths supported by the project:

- Cloud deployment: Vercel frontend, Render API and worker, MongoDB Atlas, Upstash Redis.
- Docker deployment: local or VPS-style production Compose with MongoDB, Redis, API, worker, and Nginx web.

Do not commit `.env` files or real credentials. Use dashboard environment variables for production secrets.

## Cloud Architecture

```text
Vercel static React app
  -> calls Render API at https://your-api.onrender.com/api/v1
Render API
  -> MongoDB Atlas for persistent data
  -> Upstash Redis for BullMQ queues
  -> Render persistent disk at /app/uploads for local document storage
Render worker
  -> consumes email jobs from Redis
  -> updates notification status in MongoDB
```

## Vercel Frontend

Use these settings in the Vercel project:

- Framework Preset: Vite
- Root Directory: repository root
- Install Command: `npm ci`
- Build Command: `npm run build --workspace @medvault/shared && npm run build --workspace @medvault/web`
- Output Directory: `apps/web/dist`

Environment variables:

```env
VITE_API_URL=https://your-render-api.onrender.com/api/v1
```

The root `vercel.json` keeps these settings in code and rewrites all frontend routes to `index.html` so refresh/deep links work.

## Render API

Use the root `render.yaml` Blueprint, or create services manually.

API service settings:

- Service Type: Web Service
- Runtime: Node
- Region: Singapore or the closest region to your users
- Build Command: `npm ci && npm run build --workspace @medvault/shared && npm run build --workspace @medvault/api`
- Start Command: `npm run start --workspace @medvault/api`
- Health Check Path: `/live`

Required API environment variables:

```env
NODE_ENV=production
CLIENT_ORIGIN=https://your-vercel-app.vercel.app
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster-host>/medvault?retryWrites=true&w=majority&appName=<app-name>
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

- Render provides `PORT`; the API also supports `API_PORT` for local and Docker runs.
- `AUTH_COOKIE_SAME_SITE=none` and `AUTH_COOKIE_SECURE=true` are required when the Vercel frontend and Render API are on different HTTPS domains.
- Attach a persistent disk mounted at `/app/uploads` if using the current local document storage adapter.

## Render Worker

Worker service settings:

- Service Type: Background Worker
- Runtime: Node
- Region: same as API
- Build Command: `npm ci && npm run build --workspace @medvault/shared && npm run build --workspace @medvault/worker`
- Start Command: `npm run start --workspace @medvault/worker`

Required worker environment variables:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster-host>/medvault?retryWrites=true&w=majority&appName=<app-name>
REDIS_URL=rediss://default:<password>@<upstash-host>:6379
EMAIL_QUEUE_NAME=medvault-email
```

Optional real-email variables:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<smtp-user>
SMTP_PASS=<smtp-password>
EMAIL_FROM=MedVault <no-reply@yourdomain.com>
```

If SMTP is not configured, the worker uses Nodemailer's JSON transport, which is useful for demos but does not send real email.

## MongoDB Atlas

- Create or reuse an Atlas cluster.
- Create a database user with read/write access to the `medvault` database.
- Add Render outbound access in Network Access. For quick portfolio demos, `0.0.0.0/0` works but is less strict. For stronger security, use a provider/network setup with fixed outbound IPs.
- Use the Drivers connection string and include `/medvault` before the query string.

Example shape:

```text
mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/medvault?retryWrites=true&w=majority&appName=MedVault
```

## Upstash Redis

- Create a Redis database in the closest region to the Render service.
- Copy the TCP URL, not the REST URL.
- Use the `rediss://` URL in both API and worker.

Example shape:

```text
rediss://default:<password>@your-db.upstash.io:6379
```

## Document Uploads

The current production-ready adapter is local disk storage. On Render, use:

```env
STORAGE_PROVIDER=local
LOCAL_UPLOAD_DIR=/app/uploads
```

Attach a Render persistent disk at `/app/uploads`. Without persistent storage, uploaded files can be lost when the service restarts or redeploys.

Cloudinary/S3 provider names are reserved in the shared contract, but those adapters are not implemented in the current codebase.

## Production Docker Deployment

Create a production env file:

```powershell
copy .env.production.example .env.production
```

Update secrets before running:

- `MONGO_ROOT_PASSWORD`
- `ACCESS_TOKEN_SECRET`
- `REFRESH_TOKEN_SECRET`
- SMTP values if you want real email delivery

For local Docker testing without HTTPS, keep:

```env
AUTH_COOKIE_SECURE=false
AUTH_COOKIE_SAME_SITE=lax
CLIENT_ORIGIN=http://localhost:8080
VITE_API_URL=/api/v1
```

For a real same-domain HTTPS Docker deployment, set:

```env
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAME_SITE=lax
CLIENT_ORIGIN=https://your-domain.example
VITE_API_URL=/api/v1
```

Start production Compose:

```powershell
npm run docker:prod:up
```

Open:

```text
http://localhost:8080
http://localhost:4000/health
http://localhost:4000/live
http://localhost:4000/ready
http://localhost:4000/metrics
```

Logs:

```powershell
npm run docker:prod:logs
```

Stop:

```powershell
npm run docker:prod:down
```

## Pre-Deployment Verification

Run before deploying:

```powershell
npm run typecheck
npm run build
npm run test
```