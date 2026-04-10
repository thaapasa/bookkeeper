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

- `src/client/` — React 19 frontend (Mantine 9, Zustand, TanStack Query)
- `src/server/` — Express backend (pg-promise, Pino logging)
- `src/shared/` — Shared types, Zod schemas, and utilities
- `src/integration/` — Integration tests (require running dev server)
- `migrations/` — Knex migration files (raw SQL in `knex.raw()`)

Import aliases: `shared/*`, `client/*`, `server/*` resolve from `src/`.

## Frontend Conventions

Read `src/client/coding-conventions.md` for the full frontend coding conventions.
That file is the single source of truth for how UI code should be written.

See also `src/client/CLAUDE.md`.

## Backend Conventions

Read `src/server/coding-conventions.md` for the full backend coding conventions.

See also `src/server/CLAUDE.md`.

## Code Quality: Be Proactive

When working on any task, **actively look for bad code** in the files you touch and nearby
code. This includes but is not limited to:

- Legacy patterns (inline styles for layout, raw pixel spacing, Bacon.js streams)
- Wrong idioms (floating-point money, raw SQL strings, unvalidated inputs, `any` types)
- Code smells (copy-paste duplication, overly complex logic, dead code, misleading names)
- Missing best practices (no error handling, no Zod validation, inconsistent patterns)

**If a fix is within scope of the current task, just fix it.** If it seems out of scope,
always ask whether to include the fix — don't silently skip it. The goal is to
incrementally clean up the entire codebase, so no bad code should go unmentioned.

## Key Conventions

### Type Definitions

Define Zod schema and derive TypeScript type in `src/shared/`:

```typescript
export const MyInput = z.object({ name: z.string().trim().min(1) });
export type MyInput = z.infer<typeof MyInput>;
```

Use existing primitives: `ObjectId`, `ObjectIdString`, `IntString`, `ISODate`.

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

### Dates and Times

Use Luxon `DateTime` for date/time computation. **Never use JS `Date`** anywhere in the
codebase (the only exception is `Date.now()` for performance timing).

**Branded string types** cross all boundaries (API, DB, props):

- `ISODate` — calendar dates (`"2026-04-09"`)
- `ISOMonth` — year-month (`"2026-04"`)
- `ISOTimestamp` — timestamps with timezone (`"2026-04-09T12:00:00.000+03:00"`)

Never use `Date`, `DateTime`, or `z.date()` in types that cross API boundaries. Use
branded string types with Zod string schemas.

Conversion utilities live in `shared/time/`. Use `toISODate()` for calendar dates and
`toISOTimestamp()` for timestamps. See `docs/archive/DATE_HANDLING.md` for historical
context and antipatterns to avoid.

### Logging

Server: Pino logger with context object first — `logger.info({ expenseId }, 'Created')`.
Client: Simple logger from `client/Logger`.

### After Making Changes

Always run `bun format` after making code changes to auto-fix import ordering and
formatting. Then run `bun lint` to verify everything passes.

**Do not commit** unless the user explicitly asks. They may want to review changes or
gather multiple changes into a single commit.

### Adding a New Feature

1. Define Zod schemas/types in `src/shared/`
2. Create DB functions in `src/server/data/`
3. Add API endpoint in `src/server/api/`
4. Add API client method in `src/client/data/ApiConnect.ts`
5. Create UI components in `src/client/ui/<feature>/` (use Mantine components)
6. Create migration if needed: `bun migrate-make <name>`
7. Run `bun format && bun lint` to verify

### Domain Model

Three expense types with division invariants:

- **expense**: split into `cost` (who paid, sums to −expense.sum) and `benefit` (who
  benefits, sums to +expense.sum)
- **income**: split into `income` (who received) and `split` (who benefits)
- **transfer**: split into `transferor` and `transferee`

For each expense, `sum(expense_division.sum) = 0` always holds.
