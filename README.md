# Kukkaro (bookkeeper)

A personal expense tracking web application for managing income, expenses, and transfers between users in a shared household. Built with TypeScript, React, and PostgreSQL.

## Quick Start

```bash
# Install dependencies
bun install

# Start dev database (Docker)
bun create-dev-db

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

Install deps with [bun](https://bun.sh/).

### Database

If you want to use a docker DB, start postgres DB with `bun create-dev-db`.

Note for Windows: if server gives error `role "Username" does not exist`, 
log in to database (for example, with DBeaver), and create the missing role.

### Server

Create file `.env` with the following contents (adjust as required):

Local dev DB is running on port `15488` by default (if installed via Docker
with `bun create-dev-db`).

```ini
SERVER_PORT=3100
LOG_LEVEL=info
SHOW_ERROR_CAUSE=true
SESSION_TIMEOUT=20 minutes
DB_URL=postgresql://postgres:postgres@localhost:15488/postgres
DB_SSL=false
DEBUG=bookkeeper*
```

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

The `DEBUG` switch (in `.env` or supplied as an environment variable) controls logging output.

### Client web app

Start development build by running `bun ui`.

### Package scripts

`bun run <target>` or just `bun <target>`:

- `server`: Start server for development use (runs `bun --watch`)
- `ui`: Start client builder for development (runs `vite`)
- `build-server`: Build production version of server under `build-server/`
- `build-client`: Build production bundle of web app under `build/`
- `start-server`: Runs production server
- `ps-server`: Shows the process number of the active server
- `stop-server`: Kills the running server instance (in case the port has not been released)
- `migrate`: Run migrations (this is automatically run on dev-server startup)
- `migrate-make migration-name`: Create a new migration file
- `rollback`: Rollback latest migration

### Testing

- Run `bun test` to execute tests (uses Bun's built-in test runner)
- Integration tests require the dev server to be running

### Linting

- Run `bun lint` to check for lint errors
- Run `bun format` to auto-fix formatting issues

## Documentation

This project includes comprehensive documentation for both developers and AI agents:

### Technical Documentation

- [Architecture](./docs/ARCHITECTURE.md) - Detailed codebase structure, technology stack, and coding patterns
- [Backend Improvements](./docs/BACKEND_IMPROVEMENTS.md) - Planned backend improvements and tech debt
- [Frontend Improvements](./docs/FRONTEND_IMPROVEMENTS.md) - Planned frontend improvements and tech debt

### AI Agent Rules (Cursor)

These files provide context for AI-assisted coding:

- [Backend Rules](./.cursor/rules/backend.mdc) - Server-side development conventions
- [Frontend Rules](./.cursor/rules/frontend.mdc) - React/UI development conventions
- [Code Improvement](./.cursor/rules/code-improvement.mdc) - Code review and best practices persona
- [Documentation Rules](./.cursor/rules/documentation.mdc) - Documentation standards and review guidelines

### Quick References

- [Credits](./CREDITS.md) - Attribution for icons and images

## Images

- Source image (bank card): 52 x 34 px = 208 x 136 px @4x

## Sum / balance calculation

Each expense has a sum stored in DB table `expenses.sum`, and a corresponding
division as rows in `expense_division`.

### Expense sum invariant

Expense sum is always non-negative.

### Expense division invariant

For each `expense_division.expense_id`, the sum `sum(expense_division.sum)` equals `0`.

### Expense types

There are three types of expenses: `expense`, `income`, and `transfer`.

- `expense`: user has purchased something.
  The sum `sum(expense.sum)` for `expense.type = expense` gives the total cost of the registered
  expenses.
  Each `expense` is divided into `cost`s and `benefit`s:
  - `cost`: tracks who has paid for the expense
  - `benefit`: tracks who benefits from the purchase
- `income`: user has received income.
  The sum `sum(expense.sum)` for `expense.type = income` gives the total income of the registered
  expenses.
  Each `income` is divided into `income`s and `split`s:
  - `income`: tracks who has received the money
  - `split`: tracks who should benefit from the money
- `transfer`: money is transferred within the group.
  These expenses do not contribute to total cost or income, but they do affect user balance.
  Each `transfer` is divided into `transferor`s and `transferee`s:
  - `transferor`: tracks who has transferred the money
  - `transferee`: tracks who has received the money

#### Invariants

- For each expense with `expense.type = expense`:
  - The sum of division rows with `expense_division.type = cost` must equal `-expense.sum`
  - The sum of division rows with `expense_division.type = benefit` must equal `expense.sum`
- For each expense with `expense.type = income`:
  - The sum of division rows with `expense_division.type = income` must equal `expense.sum`
  - The sum of division rows with `expense_division.type = split` must equal `-expense.sum`
- For each expense with `expense.type = transfer`:
  - The sum of division rows with `expense_division.type = transferor` must equal `-expense.sum`
  - The sum of division rows with `expense_division.type = transferee` must equal `expense.sum`

### User balance / debts

For user `u` with id `u.id`, we define `user value` as the
sum `sum(expense_division.sum)` of all division rows
with `expense_division.user_id = u.id`.

A positive `user value` means that the user has gained more benefit than losses from the
registered expenses, and a negative value means that the user has paid for more than what
he has benefitted.

Thus, we further define `user balance` to equal `user value` negated, so that
`user balance` means (semantically) what the user's current balance is (in regards to the
registered entries); a positive `user balance` means that the user is owed money, and
a negative `user balance` means that the user is behind the budget and should pay for
shared expenses.
