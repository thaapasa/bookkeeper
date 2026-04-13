# syntax=docker/dockerfile:1.6

# Stage 1: install all dependencies + build client and server bundles.
FROM oven/bun:1.3.12 AS builder
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts \
 && cd node_modules/sharp && bun install

COPY . .

# Revision metadata is normally produced by script/update-revision.sh via git.
# Docker builds get it from build args instead so the image doesn't need git history.
ARG APP_VERSION=0.0.0-unknown
ARG COMMIT_SHA=unknown
ARG COMMIT_MSG="docker build"
RUN printf '{"message":"%s","commitId":"%s","version":"%s","commits":[]}\n' \
      "$COMMIT_MSG" "$COMMIT_SHA" "$APP_VERSION" > src/server/revision.json \
 && cp src/server/revision.json src/client/revision.json

RUN bun run build-client \
 && bun run build-server

# Stage 2: install production dependencies only (smaller runtime layer).
FROM oven/bun:1.3.12 AS prod-deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production --ignore-scripts \
 && cd node_modules/sharp && bun install

# Stage 3: runtime image. Runs as the pre-created `bun` user (UID 1000) so
# bind-mounted volumes end up owned by a real non-root user on the host.
FROM oven/bun:1.3.12-slim AS runtime
WORKDIR /app
RUN chown bun:bun /app

ENV NODE_ENV=production \
    SERVER_PORT=3000 \
    STATIC_PATH=dist

COPY --from=prod-deps --chown=bun:bun /app/node_modules ./node_modules
COPY --from=builder  --chown=bun:bun /app/build-server ./build-server
COPY --from=builder  --chown=bun:bun /app/dist ./dist
COPY --from=builder  --chown=bun:bun /app/migrations ./migrations
COPY --from=builder  --chown=bun:bun /app/knexfile.js ./knexfile.js
COPY --from=builder  --chown=bun:bun /app/package.json ./package.json

# Fallback dirs for dev / single-container runs where no bind mounts exist.
# In production these are shadowed by host bind mounts.
RUN mkdir -p uploads content && chown bun:bun uploads content

USER bun

EXPOSE 3000

# knex reads knexfile.js to run migrations; the bundled server runs afterwards.
CMD ["sh", "-c", "bun run migrate && bun run build-server/BookkeeperServer.js"]
