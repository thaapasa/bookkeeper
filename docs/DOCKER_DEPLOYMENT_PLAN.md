# Docker-based production deployment

**Status:** Planned
**Tracking issue:** [#96 — Dockerize for prod deploy via GHCR](https://github.com/thaapasa/bookkeeper/issues/96)

## Context

Today the app is deployed via `script/deploy.sh`, which SCPs a client tarball to
`kukkaro.pomeranssi.fi` and runs `install-prod.sh` over SSH. The goal is to switch to a
container-based workflow: a manually-triggered GitHub Actions pipeline builds a Docker
image (Bun server + bundled SPA), pushes it to GHCR as a public image, and the prod
host runs it behind a Caddy reverse proxy via docker-compose. The DB is provided
externally via `DB_URL`; upload directories are host-mounted so state survives
container restarts.

The new flow runs **side-by-side** with the existing deploy during migration — legacy
`script/start-server.sh` must keep working unchanged from the operator's point of view
until the container flow is verified end-to-end.

## Decisions

- **Logging:** Production logs go to stdout (container-native). The legacy flow
  redirects stdout to `log/server.log` via the shell script so operators see the same
  log files they always have.
- **Port:** The container listens on **3000** via `SERVER_PORT=3000` in Dockerfile
  ENV. The code default stays at 3100 — dev and legacy prod are untouched.
- **Static assets:** New `STATIC_PATH` env var. Dev/legacy default is `public`
  (unchanged behaviour). Dockerfile sets `STATIC_PATH=dist`. Cache-Control is fixed
  so Vite's hashed `/assets/*` files get `public, max-age=31536000, immutable` and
  `index.html` stays no-cache.
- **Image tags:** Semver from `package.json` (e.g. `ghcr.io/thaapasa/bookkeeper:0.9.2`),
  plus a rolling `:latest`. The release workflow **fails** if the semver tag already
  exists on GHCR, forcing a version bump per release.

Out of scope: Caddy config on the host, docker-compose file on the host (user-managed),
multi-arch builds (amd64 only unless the host is arm).

## Code changes

### `src/server/Logger.ts` — stdout in production

Collapse the dev/prod split: both log to stdout; optional Loki remains additive. The
production file-transport branch is removed.

### `script/start-server.sh` — redirect stdout to the legacy log file

Since the app no longer writes `log/server.log`, have the shell do it so the legacy
prod flow looks the same to operators. One-line change:

```diff
-NODE_ENV=production nohup bun run build-server/BookkeeperServer.js >log/start-server.log &
+NODE_ENV=production nohup bun run build-server/BookkeeperServer.js >log/server.log 2>&1 &
```

`log/server.log` is still rotated on restart by the existing block (lines 23–28), and
the `bun pretty-log < log/server.log` tail at the end continues to show startup logs.
The standalone `log/start-server.log` file is no longer produced and is redundant.

### `src/server/Config.ts` — new `STATIC_PATH`

Add `staticPath: process.env.STATIC_PATH ?? 'public'`. Do **not** change the
`SERVER_PORT` default — it stays at 3100 for dev and legacy prod. The Docker image
sets `SERVER_PORT=3000` via ENV.

### `src/server/server/ServerSetup.ts` — configurable static dir + cache headers

Replace the hardcoded `'public'` with `config.staticPath`. Move `nocache()` off the
static asset path and set proper cache headers:

- `/assets/*` (Vite's hashed output): `Cache-Control: public, max-age=31536000, immutable`
- Other static files (favicons, manifest — versioned via `?v=…`): `max-age=3600`
- `/p/*` SPA fallback and `/api/*`: keep `nocache()`
- SPA fallback serves `path.join(config.curDir, config.staticPath, 'index.html')`

```ts
app.use(
  '/assets',
  express.static(path.join(config.staticPath, 'assets'), {
    immutable: true,
    maxAge: '1y',
  }),
);
app.use(express.static(config.staticPath, { maxAge: '1h' }));
// nocache() applied only to /api and /p/* below
```

## New files

### `Dockerfile` (multi-stage, at repo root)

Stages:

1. **builder** (`oven/bun:1.3.12`): copy `package.json` + `bun.lock*`;
   `bun install --frozen-lockfile`; copy sources; `bun run build-client` → `dist/`;
   `bun run build-server` → `build-server/`.
2. **runtime**: copy `node_modules/` (pruned to production), `build-server/`, `dist/`,
   `migrations/`, `knexfile.js`, `package.json`. Do **not** copy `src/` — the bundled
   server plus externals is enough.
3. `ENV NODE_ENV=production STATIC_PATH=dist SERVER_PORT=3000`
4. `EXPOSE 3000`
5. `CMD ["sh", "-c", "bun run migrate && bun run build-server/BookkeeperServer.js"]`

`sharp` has a native binding — the `postinstall: install-sharp` hook must run in the
builder stage; the resulting `node_modules/sharp` is copied to the runtime stage.
Externals declared in `src/build-server.ts` (`pg`, `pg-promise`, `sharp`,
`@opentelemetry/*`) must be present in runtime `node_modules`.

### `.dockerignore`

Exclude `node_modules`, `dist`, `build`, `build-server`, `log`, `uploads`, `content`,
`.git`, `.env*`, `docs`, `tests`, `playwright-report`, `.github`, `.vscode`, `.idea`,
etc.

### `.github/workflows/release.yml` — manual image build & push

Trigger: `workflow_dispatch` only. Runner `ubuntu-24.04`.

1. `actions/checkout@v4`
2. `VERSION=$(jq -r .version package.json)` → `$GITHUB_ENV`
3. **Version guard:** `docker login ghcr.io` then `docker manifest inspect
   ghcr.io/<owner>/bookkeeper:${VERSION}`. If it succeeds (the image exists), fail
   the workflow with: "Version X.Y.Z already published — bump package.json version."
4. `docker/setup-buildx-action@v3`
5. `docker/login-action@v3` against `ghcr.io` with `${{ secrets.GITHUB_TOKEN }}`
6. `docker/build-push-action@v5`, tags = `ghcr.io/<owner>/bookkeeper:${VERSION}` and
   `:latest`, `push: true`, `cache-from`/`cache-to: type=gha`

The existing `build.yml` CI workflow (lint/tests) stays independent.

## Host-side docker-compose (reference — not in repo)

```yaml
services:
  bookkeeper:
    image: ghcr.io/thaapasa/bookkeeper:latest
    restart: unless-stopped
    environment:
      DB_URL: postgresql://…
      NODE_ENV: production
    volumes:
      - /srv/bookkeeper/uploads:/app/uploads
      - /srv/bookkeeper/content:/app/content
    expose:
      - "3000"
    networks: [caddy]
```

`/app/uploads` and `/app/content` match the defaults of `UPLOAD_PATH` and
`CONTENT_PATH` relative to `WORKDIR /app` in the Dockerfile.

## Critical files

- `src/server/Logger.ts` — stdout in prod
- `script/start-server.sh` — stdout redirected to `log/server.log` for legacy flow
- `src/server/Config.ts` — add `staticPath`
- `src/server/server/ServerSetup.ts` — static dir + cache headers
- New: `Dockerfile`, `.dockerignore`, `.github/workflows/release.yml`

## Verification

1. **Local image build:** `docker build -t bookkeeper:test .` completes in a few
   minutes; final image size under ~500 MB.
2. **Local run** against a local postgres:
   ```sh
   docker run --rm -p 3000:3000 -e DB_URL=… \
     -v $(pwd)/uploads:/app/uploads -v $(pwd)/content:/app/content \
     bookkeeper:test
   ```
   - `curl http://localhost:3000/` serves `index.html` with no-cache.
   - `curl -I http://localhost:3000/assets/index-<hash>.js` shows
     `cache-control: public, max-age=31536000, immutable`.
   - `curl http://localhost:3000/api/session` returns a sensible response.
   - `docker logs` shows JSON Pino lines.
   - Upload a receipt via the UI → verify it lands in the host-mounted `uploads/`.
3. **Migration run:** Start against a fresh DB; confirm tables are created.
4. **Dev still works:** `bun server` (port 3100) and `bun ui` (port 3000 proxying to
   3100) unchanged.
5. **Legacy prod still works:** on the current prod host, `bun run build-server` +
   `script/start-server.sh` starts the server, populates `log/server.log` via the
   shell redirect, and the `bun pretty-log` tail prints startup lines. SPA served
   from `public/` as before.
6. **Release workflow:**
   - `workflow_dispatch` → image appears in GHCR at the package.json version.
   - Re-run without bumping version → workflow fails at the guard step.
   - Bump version, re-run → succeeds; both `:X.Y.Z` and `:latest` updated.
7. **Prod host (side-by-side):** `docker compose pull && docker compose up -d` on a
   separate port/hostname while the legacy process keeps running on the current URL.
   Verify end-to-end against the container, then cut over Caddy once confident.
