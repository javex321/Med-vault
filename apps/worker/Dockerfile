# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS deps
WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json

RUN npm ci --workspace @medvault/shared --workspace @medvault/worker --include-workspace-root=false

FROM deps AS build
COPY packages/shared packages/shared
COPY apps/worker apps/worker

RUN npm run build --workspace @medvault/shared \
  && npm run build --workspace @medvault/worker

FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json

RUN npm ci --omit=dev --workspace @medvault/shared --workspace @medvault/worker --include-workspace-root=false \
  && npm cache clean --force \
  && chown -R node:node /app

COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/apps/worker/dist apps/worker/dist

USER node

CMD ["npm", "run", "start", "--workspace", "@medvault/worker"]
