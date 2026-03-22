# Kukkaro (Bookkeeper)

Personal expense tracking web app for shared households. Tracks expenses, income, and
transfers between users with split/division tracking. Finnish-language UI.

## Commands

```bash
bun install              # Install dependencies
bun server               # Start backend dev server (port 3100, auto-runs migrations)
bun ui                   # Start frontend dev server (port 3000, proxies /api to 3100)
bun test                 # Run all tests (Bun's built-in test runner)
bun test src/shared/util/Money.test.ts  # Run a single test file
bun lint                 # ESLint + TypeScript type check
bun lint-tsc             # TypeScript type check only
bun format               # Auto-fix lint/formatting issues
bun migrate              # Run database migrations
bun migrate-make <name>  # Create a new migration
bun dump-schema          # Dump DB schema to docs/SCHEMA.sql
```

## Architecture

Monorepo with shared types between client and server. All code is TypeScript, run with Bun.

- `src/client/` — React 19 frontend (Mantine 8, Zustand, Bacon.js legacy)
- `src/server/` — Express backend (pg-promise, Pino logging)
- `src/shared/` — Shared types, Zod schemas, and utilities
- `src/integration/` — Integration tests (require running dev server)
- `migrations/` — Knex migration files (raw SQL in `knex.raw()`)

Import aliases: `shared/*`, `client/*`, `server/*` resolve from `src/`.

See `src/client/CLAUDE.md` and `.github/agents/frontend.agent.md` for frontend-specific
conventions (Mantine, styling, state). See `src/server/CLAUDE.md` and
`.github/agents/backend.agent.md` for backend-specific patterns (routing, database).

## Key Conventions

### Type Definitions

Define Zod schema and derive TypeScript type in `src/shared/`:

```typescript
export const MyInput = z.object({ name: z.string().trim().min(1) });
export type MyInput = z.infer<typeof MyInput>;
```

Use existing primitives: `ObjectId`, `ObjectIdString`, `IntString`, `ISODateString`.

### Money

Always use `Money` from `shared/util` for monetary values (wraps Big.js). Never use
floating-point arithmetic for money.

```typescript
const total = Money.from(a).plus(b);
Money.toString(total); // "125.50"
```

### Error Handling

Use typed errors from `shared/types/Errors`:

```typescript
throw new NotFoundError('ITEM_NOT_FOUND', 'item');
throw new InvalidInputError('Invalid data');
throw new AuthenticationError('Session expired');
```

### Import Order

Enforced by eslint-plugin-simple-import-sort:

1. Side effects
2. External packages (`@mantine/core`, `react`, etc.)
3. Other absolute imports
4. Internal aliases (`shared/`, `client/`, `server/`)
5. Relative imports (`./`, `../`)

### Dates

Use Luxon `DateTime` throughout. Helpers in `shared/time/`.

### Logging

Server: Pino logger with context object first — `logger.info({ expenseId }, 'Created')`.
Client: Simple logger from `client/Logger`.

### Adding a New Feature

1. Define Zod schemas/types in `src/shared/`
2. Create DB functions in `src/server/data/`
3. Add API endpoint in `src/server/api/`
4. Add API client method in `src/client/data/ApiConnect.ts`
5. Create UI components in `src/client/ui/<feature>/` (use Mantine components)
6. Create migration if needed: `bun migrate-make <name>`
7. Run `bun lint` to verify

### Domain Model

Three expense types with division invariants:

- **expense**: split into `cost` (who paid, sums to −expense.sum) and `benefit` (who
  benefits, sums to +expense.sum)
- **income**: split into `income` (who received) and `split` (who benefits)
- **transfer**: split into `transferor` and `transferee`

For each expense, `sum(expense_division.sum) = 0` always holds.
