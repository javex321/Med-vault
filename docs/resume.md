# MedVault Resume Notes

## Short Project Description

MedVault is a production-style MERN personal health timeline platform for securely managing patient profiles, medical events, medications, documents, notifications, share links, and consent records.

## Resume Bullets

- Built a full-stack health records platform using React, TypeScript, Express, MongoDB, Redis, BullMQ, Docker, and a TypeScript monorepo architecture.
- Implemented secure authentication with Argon2id password hashing, JWT access tokens, refresh token rotation, httpOnly cookies, and role-based permissions.
- Designed profile-scoped APIs for patient profiles, timeline events, medications, documents, notifications, share links, and consent management.
- Added medical document uploads with multipart validation, SHA-256 checksums, local/S3-style storage abstraction, metadata search, and frontend document vault UI.
- Built secure document sharing with hashed public tokens, expiration, access limits, revoke flow, and public-safe document previews.
- Implemented a consent ledger with legal basis, access scopes, expiration, and withdrawal state to model healthcare-style authorization.
- Separated API and worker services using BullMQ and Redis for asynchronous email notifications.
- Added Prometheus-compatible metrics, liveness/readiness probes, request IDs, typed error envelopes, Docker deployment, CI workflow, and Vitest/RTL/Supertest coverage.

## Interview Talking Points

- Explain why share links store only token hashes and why plaintext tokens are returned once.
- Explain the separation between consent records and share links.
- Explain owner/profile scoping as the core access-control boundary.
- Explain why API and worker services are separated.
- Explain how the storage adapter can evolve from local files to S3 or Cloudinary.
- Explain how readiness differs from liveness in deployment health checks.

## Suggested Portfolio Title

MedVault - Secure Personal Health Timeline Platform

## Suggested One-Line Summary

Production-style MERN healthcare app with secure auth, medical timelines, document vault, share links, consent governance, background jobs, observability, tests, and Docker deployment.
