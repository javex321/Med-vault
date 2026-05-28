# MedVault Project Overview

Last scanned: 2026-05-28

This is a beginner-friendly overview of what MedVault is, how it is organized, and what is currently built.

## What This Project Is

MedVault is a full-stack web application for managing personal medical information.

It has:

- A frontend website where users log in and manage health records.
- A backend API that stores and protects the data.
- A MongoDB database for the data.
- A Redis/BullMQ worker for background notification/email jobs.
- Shared TypeScript types used by multiple parts of the app.
- Deployment files for Vercel, Render, and Docker.

## Main Purpose Of MedVault

The main purpose is to help a user keep a secure personal health timeline.

The user can:

- Register and log in.
- Create patient profiles.
- Add medical timeline events.
- Track medications.
- Upload medical documents.
- Create secure document share links.
- Record consent grants.
- View notifications.

## Tech Stack Used

| Area | Technology |
| --- | --- |
| Frontend | React, Vite, TypeScript, Tailwind CSS |
| Frontend data | TanStack Query |
| Frontend forms | React Hook Form, Zod |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB, Mongoose |
| Auth | JWT, httpOnly cookies, Argon2 password hashing, refresh token rotation |
| Queue/worker | Redis, BullMQ |
| Email worker | Nodemailer |
| Shared types | Local `@medvault/shared` package |
| Testing | Vitest, React Testing Library, Supertest |
| Deployment | Vercel, Render, Docker, Docker Compose |

## Folder Structure Explanation

```text
D:\MedVault
  apps/
    api/        Backend Express API
    web/        Frontend React app
    worker/     Background email/notification worker
  packages/
    shared/     Shared TypeScript types
  docs/         Existing deployment/resume docs
  .github/      GitHub Actions workflow
  .codex/       Codex agent configuration
```

The project is a monorepo. That means one repository contains multiple apps/packages.

The root `package.json` controls the workspaces:

- `apps/*`
- `packages/*`

## Frontend Explanation

Frontend location: `apps/web`

The frontend is the browser app. It is built with React and Vite.

Important frontend files:

- `apps/web/src/main.tsx` starts the React app.
- `apps/web/src/App.tsx` is the main app shell and dashboard.
- `apps/web/src/lib/api.ts` is the frontend API client.
- `apps/web/src/styles.css` contains Tailwind/global styles.

Main frontend screens/features:

- Login/register page
- Dashboard/overview
- Patient profile form
- Timeline page
- Medication form
- Documents page
- Notifications page
- Consent/security page

The frontend uses `VITE_API_URL` to know where the backend API is.

For local development, it is usually:

```text
http://localhost:4000/api/v1
```

For Vercel, it should be the deployed Render API URL, for example:

```text
https://your-render-api.onrender.com/api/v1
```

## Backend Explanation

Backend location: `apps/api`

The backend is an Express API written in TypeScript.

Important backend files:

- `apps/api/src/server.ts` starts the backend server.
- `apps/api/src/app.ts` configures Express, middleware, routes, and errors.
- `apps/api/src/routes/index.ts` connects all API routes.
- `apps/api/src/config/env.ts` checks required environment variables.
- `apps/api/src/config/db.ts` connects to MongoDB.
- `apps/api/src/config/redis.ts` connects to Redis.

The backend uses this pattern:

- `routes` decide which URL is being called.
- `controllers` handle request/response.
- `services` contain business logic.
- `models` define MongoDB data.
- `schemas` validate incoming data.
- `mappers` shape database data into API responses.

## Database Explanation

Database used: MongoDB.

Mongoose is used to define database models and talk to MongoDB.

Main models:

- `User`
- `RefreshToken`
- `PatientProfile`
- `TimelineEvent`
- `Medication`
- `MedicalDocument`
- `DocumentShareLink`
- `ConsentGrant`
- `Notification`

Most health data is linked to the logged-in user and a patient profile.

## Authentication Explanation

The app has a real authentication system.

What is built:

- User registration
- User login
- User logout
- Current user check
- Password hashing with Argon2
- JWT access tokens
- Refresh token rotation
- httpOnly cookies
- Role/permission helpers

Simple explanation:

1. User logs in.
2. Backend checks email/password.
3. Backend sends secure cookies to the browser.
4. Browser uses those cookies for future API calls.
5. If the access token expires, the app can try refreshing the session.

Important security note:

Cookie auth is built, but the scan did not find explicit CSRF protection or API rate limiting yet.

## API Explanation

Base API path:

```text
/api/v1
```

Main API areas:

- `/auth`
- `/patient-profiles`
- `/patient-profiles/:profileId/timeline-events`
- `/patient-profiles/:profileId/medications`
- `/patient-profiles/:profileId/documents`
- `/patient-profiles/:profileId/consents`
- `/notifications`
- `/share-links/:token`

Health and monitoring endpoints:

- `/health`
- `/live`
- `/ready`
- `/metrics`

## Deployment Explanation

Deployment files found:

- `vercel.json`
- `render.yaml`
- `docker-compose.yml`
- `docker-compose.prod.yml`
- `apps/api/Dockerfile`
- `apps/web/Dockerfile`
- `apps/worker/Dockerfile`
- `apps/web/nginx.conf`
- `.github/workflows/ci.yml`

Planned cloud setup:

- Vercel hosts the frontend.
- Render hosts the backend API.
- Render can host the worker.
- MongoDB Atlas stores data.
- Upstash Redis stores queue data.

Important deployment detail:

This is a monorepo. Vercel and Render build commands should run from the repository root, because the root has `package-lock.json`.

## Environment Variables Explanation

Environment variables are settings stored outside the source code.

Important variables:

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | development, test, or production mode. |
| `API_PORT` / `PORT` | Backend server port. |
| `CLIENT_ORIGIN` | Frontend URL allowed by backend CORS. |
| `VITE_API_URL` | Backend API URL used by frontend. |
| `MONGODB_URI` | MongoDB connection string. |
| `REDIS_URL` | Redis connection string. |
| `ACCESS_TOKEN_SECRET` | Secret for access JWTs. Must be strong. |
| `REFRESH_TOKEN_SECRET` | Secret for refresh JWTs. Must be strong. |
| `AUTH_COOKIE_SECURE` | Should be `true` in HTTPS production. |
| `AUTH_COOKIE_SAME_SITE` | Cookie SameSite setting: `lax`, `strict`, or `none`. |
| `STORAGE_PROVIDER` | File storage provider. Currently local storage is implemented. |
| `LOCAL_UPLOAD_DIR` | Folder for uploaded files. |
| `EMAIL_QUEUE_NAME` | BullMQ email queue name. |
| `SMTP_*` | Email server settings. Optional for real email sending. |

Never commit real `.env` secrets to Git.

## Current Project Status

MedVault is already a strong full-stack project. The main features are built, and the structure is good.

The project is not fully production-hardened yet.

Most important remaining work:

- Fix deployment settings.
- Add rate limiting.
- Add CSRF strategy.
- Add lint/format tooling.
- Improve tests.
- Improve production storage for uploaded files.
- Add better frontend empty/error states.
