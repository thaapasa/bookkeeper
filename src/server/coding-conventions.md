# Backend Coding Conventions

This is the single source of truth for how backend code should be written in this
project. All new and modified server code must follow these conventions.

## Technology Stack

- **Runtime**: Bun
- **Framework**: Express
- **Database**: PostgreSQL via pg-promise
- **Validation**: Zod
- **Logging**: Pino
- **Dates**: Luxon (branded string types at boundaries)

## Validated Router Pattern

All API endpoints use `createValidatingRouter` with Zod schemas and automatic
transactions:

```typescript
const api = createValidatingRouter(Router());

api.getTx(
  '/path/:id',
  { query: QuerySchema, response: ResponseSchema, groupRequired: true },
  (tx, session, { params, query }) => dbFunction(tx, session.group.id, params.id),
);
```

- `getTx`/`postTx`/`putTx`/`deleteTx` — run handler in a database transaction
- `get`/`post`/`put`/`delete` — for non-database operations
- Always specify Zod schemas for `query`, `body`, and `response`
- Set `groupRequired: true` in the spec for endpoints needing group context
- Session is auto-extracted and validated

## Database Operations

Schema reference: `docs/SCHEMA.sql`. If a local DB is available, you can also inspect
the live schema via `psql "$DB_URL"` (connection string is in `.env`).

All DB functions take `tx: DbTask` (from `server/data/Db`) as first parameter. Use
pg-promise parameterized queries with `$/paramName/` syntax:

```typescript
const result = await tx.oneOrNone<MyType>(
  `SELECT * FROM my_table WHERE id = $/id/ AND group_id = $/groupId/`,
  { id, groupId },
);
```

Query methods: `one()`, `oneOrNone()`, `many()`, `manyOrNone()`, `none()`, `map()`.

## Type Handling (DB <-> Server)

Custom pg type parsers in `Db.ts` convert values at the database boundary.

**Output (DB -> JS):**

- `DATE` -> `ISODate` string (pass-through, e.g. `"2026-04-09"`)
- `TIMESTAMPTZ` -> `ISOTimestamp` string (via `DateTime.fromSQL().toISO()`)
- `TIMESTAMP` (without tz) -> **throws** (schema must use `TIMESTAMPTZ`)
- `BIGINT` -> `number` (via `Number(val)`). Applied because all schema IDs are
  `integer` (int4), so bigint only appears in aggregate results like `COUNT(*)`.
  Response schemas can use `z.number()` directly for counts.
- `NUMERIC` is **left as string** on purpose — money columns are `numeric(10,2)`
  and `Money.from(stringValue)` preserves precision via Big.js. Do not add a
  parser for OID 1700.

**Input (JS -> DB):**

- For `DATE` columns: pass `toISODate(value)` — always a string, never a DateTime object
- For `TIMESTAMPTZ` columns: use `NOW()` in SQL when possible; if passing a value, use
  `toISOTimestamp(value)` to produce an ISO 8601 string
- **Never pass a Luxon `DateTime` directly** as a query parameter — always convert to a
  string first with `toISODate()` or `toISOTimestamp()`

```typescript
// Correct — explicit string conversion
await tx.one(query, { startDate: toISODate(startDate) });

// Correct — server-side timestamp
`INSERT INTO expenses (..., created) VALUES (..., NOW())`

// Wrong — raw DateTime object
await tx.one(query, { startDate: someDateTime });
```

## Error Handling

Use typed errors from `shared/types/Errors`:

```typescript
throw new NotFoundError('ITEM_NOT_FOUND', 'item');
throw new InvalidInputError('Invalid data');
throw new AuthenticationError('Session expired');
```

## Logging

Pino logger with context object first:

```typescript
logger.info({ expenseId, userId }, 'Expense created');
logger.error(error, 'Operation failed');
```

## Tracing (OpenTelemetry)

Wrap every meaningful server-side operation in an OpenTelemetry span via
`withSpan` from `server/telemetry/Spans`. SQL spans nest as children
automatically (see `Db.ts`), so a request trace shows three layers:
HTTP request → business operation → SQL.

```typescript
import { withSpan } from 'server/telemetry/Spans';

export function deleteExpense(tx: DbTask, groupId: number, expenseId: number) {
  return withSpan(
    'expense.delete',
    { 'app.group_id': groupId, 'app.expense_id': expenseId },
    async () => {
      await tx.none(`DELETE FROM expenses WHERE id=$/expenseId/`, { expenseId });
      return { status: 'OK', expenseId };
    },
  );
}
```

**When to add a span:**

- All write operations (create / update / delete) on data layer functions.
- Read operations that coordinate multiple queries or that may be slow
  (reports, statistics, search, dashboard fetches).
- Authentication-flow operations (login, session refresh).

**When to skip:**

- Trivial single-query reads (`getCategoryById`, `getAllSources`) — the SQL
  span already covers them.
- Pure computation helpers that don't touch the DB or external services.
- Inner helpers called only from another already-spanned function, unless
  splitting them up gives useful per-iteration timing (e.g. per-report,
  per-tracking-subject).

**Naming and attributes:**

- Span name: `<domain>.<action>` in lowercase (`expense.split`,
  `recurring.create_missing`, `report.calculate`).
- Attributes use the `app.*` namespace: `app.group_id`, `app.user_id`, the
  relevant entity id (`app.expense_id`, `app.report_id`, …), and any
  selector that materially changes the work done (`app.target`,
  `app.only_own`, counts).
- Do not put PII (titles, receivers, sums, emails) in attributes.

**Nested spans for slow / multi-item paths:**

When a parent span loops over items and per-item timing is useful, wrap each
iteration in its own child span — e.g. `report.search` runs a child
`report.calculate` per report, `tracking.subjects_with_data` runs a child
`tracking.statistics` per subject. This makes a single slow item visible in
the trace without manual instrumentation.

## File Naming

- API handlers: `src/server/api/*Api.ts`
- Database operations: `src/server/data/*Db.ts` or `*Service.ts`
- Types and schemas: Named by domain in `src/shared/`

## Import Conventions

Use path aliases, never relative paths that escape `src/server/`:

```typescript
import { Money } from 'shared/util';
import { DbTask } from 'server/data/Db';
```

Do not include `.ts` extensions in imports.

Import order is enforced by eslint-plugin-simple-import-sort:

1. Side effects
2. External packages (`express`, `pg-promise`, etc.)
3. Internal aliases (`shared/`, `server/`)
4. Relative imports (`./`, `../`)

## Exports

Use **named exports** for all functions and types. Do not use default exports.

## Testing

Tests use Bun's built-in runner. Files matching `*.test.ts` under `src/` are picked up
automatically.

### Locations

- **Unit tests** — colocated with source under `src/shared/` (e.g. `Money.test.ts`). Only
  pure functions. No DB, no HTTP, no server imports.
- **Integration tests** — `src/integration/*.test.ts`. Exercise the real server over HTTP
  against the real DB.
- **Test helpers** inside `src/integration/` must NOT use the `.test.ts` suffix
  (`MonthStatus.ts`, `TestCleanup.ts`) or the runner will try to execute them as suites.

### Commands

```bash
bun test             # Everything (unit + integration) — used by CI
bun test-unit        # Unit tests only (src/shared)
bun test-integration # Integration tests only — requires running dev server
bun test src/shared/util/Money.test.ts  # Single file
```

### Integration test setup

Integration tests hit `http://localhost:3100`, so `bun server` must be running. They log
into the seeded `Mäntyniemi` group as user `sale` and rely on a fixed baseline of seed
data:

- Users: `sale` (Sauli Niinistö), `jenni`
- Group: `Mäntyniemi`
- Sources: `Yhteinen tili`
- Categories: `Ruoka`

Use `findUserId`, `findCategoryId`, `findSourceId` from `shared/expense/test` to resolve
seeded IDs by name.

### Test isolation

Every suite that creates data must capture DB state before each test and clean up after:

```typescript
import { afterEach, beforeEach, describe, it } from 'bun:test';

import { logoutSession, newExpense } from 'shared/expense/test';
import { createTestClient, SessionWithControl } from 'shared/net/test';
import { logger } from 'server/Logger';

import { captureTestState, cleanupTestDataSince, TestState } from './TestCleanup';

describe('my feature', () => {
  let session: SessionWithControl;
  let state: TestState;
  const client = createTestClient({ logger });

  beforeEach(async () => {
    session = await client.getSession('sale', 'salasana');
    state = await captureTestState();
  });

  afterEach(async () => {
    await cleanupTestDataSince(session.group.id, state);
    await logoutSession(session);
  });

  // ... tests
});
```

`captureTestState()` records a DB-side `NOW()` and the current `MAX(categories.id)`.
`cleanupTestDataSince()` then, scoped to the test group:

- NULLs `recurring_expense_id` on test-created expenses (breaks the expense ↔
  `recurring_expenses` FK cycle).
- Deletes `expenses` created after the captured timestamp (cascades to
  `expense_division`, and to `recurring_expenses` via `template_expense_id`).
- Deletes categories with `id > maxCategoryId` (sub-categories first, then top-level —
  `parent_id` has no cascade).

This mechanism only reverses INSERTs. **Tests must not mutate or delete seed rows** —
there is no snapshot/restore for that. If you need to test mutation, create the row in
the test first, then mutate it.

If you add tests that create rows in a table not currently covered (`shortcuts`,
`expense_groupings`, `tracked_subjects`, etc.), extend `TestCleanup.ts` with a matching
delete. Use `created > $/testStart/` where the table has a `created` column, or
`id > $/maxId/` captured in `captureTestState()` otherwise.

### Test helpers

In `src/shared/expense/test/`:

- `newExpense(session, partial?)` — POSTs a new expense; merges `partial` over sensible
  defaults (seeded source/category, date, type, sum).
- `newCategory(session, data)` — POSTs a category.
- `fetchExpense`, `fetchMonthStatus`, `splitExpense` — convenience wrappers over the API.
- `division.iPayShared(session, sum)` / `division.iPayMyOwn(session, sum)` — build valid
  `ExpenseDivisionItem[]` for common split shapes.
- `checkCreateStatus(res)` — asserts the API create response looks OK; returns the new
  ID.
- `logoutSession(session)` — logs the session out, swallowing errors.

### Custom matchers

In `src/test/expect/`:

- `expectArrayContaining(actual, expected)` — every expected element appears somewhere in
  `actual`, compared with `toEqual`. Use for unordered collections.
- `expectArrayMatching(actual, expected)` — same, but uses `toMatchObject` (partial
  match).
- `expectSome(tests)` — passes if any of the supplied sub-assertions passes.
- `expectThrow(() => promise)` (from `shared/util/test`) — asserts the promise rejects.
  For shape-checking the error, prefer
  `await expect(fn()).rejects.toMatchObject({ code: '...' })`.

### Gotchas

- Integration tests share a single `db` pool. Do NOT call `db.$pool.end()` from any
  test's `afterAll` — it kills the pool for every file discovered after yours.
  `PgTypes.test.ts` is the only test that talks to `db` directly for its own reasons;
  everything else goes through the API and through `TestCleanup`.
- File discovery order is filesystem-dependent and differs between macOS (local) and
  Linux (CI). Don't rely on cross-file ordering.
- Tests assume the dev server has auto-run its migrations. Schema changes that aren't
  migrated will make integration tests fail in confusing ways.

## After Making Changes

Always run `bun format` then `bun lint` to verify.
