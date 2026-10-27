# Kukkaro (bookkeeper)

A personal expense tracking web application for managing income, expenses, and transfers between users in a shared household. Built with TypeScript, React, and PostgreSQL.

## Quick Start

```bash
# Install tools (Bun, Node, jq, claudelint, PostgreSQL client tools, rsync)
# and dependencies
mise install

# Start dev database (Docker, see docker-compose.dev.yml)
bun dev-db

# Create .env file (see Settings section below)

# Run database migrations
bun migrate

# Add example data (optional)
bun seed

# Start server (in one terminal)
bun server

# Start client dev server (in another terminal)
bun ui
```

## Development

### Settings

Setup autorebase on `git`:

```sh
git config --global pull.rebase true
```

Old settings, used only for current repository:

```sh
git config branch.autosetuprebase always
git config branch.master.rebase true
```

The project uses [mise](https://mise.jdx.dev/) to install its tools, as listed in
`mise.toml`. `mise install` installs the tools and then runs `bun install`.

### Database

The full database schema is documented in [`docs/SCHEMA.sql`](docs/SCHEMA.sql).
You can regenerate it with `bun dump-schema`.

If you want to use a docker DB, start postgres DB with `bun dev-db`
(stop it with `bun dev-db-stop`). The compose file lives at
`docker-compose.dev.yml`.

Note for Windows: if server gives error `role "Username" does not exist`, 
log in to database (for example, with DBeaver), and create the missing role.

### Server

Create file `.env` with the following contents (adjust as required):

Local dev DB is running on port `15488` by default (if started via Docker
with `bun dev-db`).

```ini
SERVER_PORT=3100
LOG_LEVEL=info
SHOW_ERROR_CAUSE=true
SESSION_TIMEOUT=20 minutes
DB_URL=postgresql://postgres:postgres@localhost:15488/postgres
DB_SSL=false
```

Useful optional switches:

- `LOG_LEVEL` — Pino log level (`trace`/`debug`/`info`/`warn`/`error`); defaults to `info`.
- `LOG_SQL=true` — log every SQL statement executed by pg-promise.
- `DELAY=500` — artificially delay each request by N ms (useful for testing loading UX).
- `TZ=Europe/Helsinki` — server time zone. The server uses it to work out the
  current date (statistics ranges, subscription baselines), so set it to the
  users' time zone. It is not hardcoded in the code. The server logs the zone at
  startup and warns if it is UTC.

#### Monitoring (optional)

To send traces and logs to [Grafana Cloud](https://grafana.com/products/cloud/),
add the following to `.env` (values from the Grafana Cloud OTLP setup page):

```ini
OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp-gateway-prod-eu-west-2.grafana.net/otlp
OTEL_EXPORTER_OTLP_HEADERS=Authorization=Basic%20<base64>
OTEL_SERVICE_NAME=bookkeeper
OTEL_ENVIRONMENT=development

# Log shipping to Grafana Loki (find these under your Grafana Cloud Loki data source settings)
GRAFANA_LOKI_HOST=https://logs-prod-eu-west-2.grafana.net
GRAFANA_LOKI_USERNAME=123456
GRAFANA_LOKI_PASSWORD=glc_eyJ...
```

When these are omitted, the server runs without any telemetry overhead.

Setup database schema by running `bun migrate`.
Add example data by running `bun seed`.

Start server by running `bun server`.

### Client web app

Start development build by running `bun ui`.

### Package scripts

`bun run <target>` or just `bun <target>`:

- `server`: Start server for development use (runs `bun --watch`)
- `ui`: Start client builder for development (runs `vite`)
- `build-server`: Build production version of server under `build-server/`
- `build-client`: Build production bundle of web app under `build/`
- `start-server`: Runs the built server (used by CI integration tests)
- `migrate`: Run migrations (this is automatically run on dev-server startup)
- `migrate-make migration-name`: Create a new migration file
- `rollback`: Rollback latest migration
- `dump-schema`: Dump current DB schema to `docs/SCHEMA.sql`

### Testing

- Run `bun test` to execute tests (uses Bun's built-in test runner)
- Integration tests require the dev server to be running

### Linting

- Run `bun lint` to check for lint errors
- Run `bun format` to auto-fix formatting issues
- Run `bun lint-claude` to check the Claude Code files (`CLAUDE.md`, `.claude/`)

## Documentation

This project includes comprehensive documentation for both developers and AI agents:

### Technical Documentation

- [Architecture](./ARCHITECTURE.md) — Codebase structure, technology stack, coding patterns,
  and how expense sums and user balances are calculated
- [Hosting](./HOSTING.md) — Release workflow, running the Docker image, and the production setup
- [Archived plans / ADRs](./docs/archive/) — Historical decision records (date handling,
  state management migration, Suspense migration, UI modernization, Docker deployment)
- Active backlog: [CODE_QUALITY_FINDINGS.md](./docs/CODE_QUALITY_FINDINGS.md),
  [RESPONSE_SCHEMA_TODO.md](./docs/RESPONSE_SCHEMA_TODO.md)

### AI Agent Instructions

These files provide context for AI-assisted coding:

- [CLAUDE.md](./CLAUDE.md) — Project conventions
- [Frontend conventions](./src/client/coding-conventions.md) — Mantine 9 / React UI conventions
- [Backend conventions](./src/server/coding-conventions.md) — Express / pg-promise conventions

### Quick References

- [Credits](./CREDITS.md) — Attribution for icons and images
