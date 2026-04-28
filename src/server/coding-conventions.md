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

### Sequential, never `Promise.all`

Run DB operations on a `tx` **sequentially** with `await` in a `for` loop — never
`Promise.all(ids.map(id => tx.…))`. A pg-promise transaction holds a single
connection: concurrent queries against it are serialized internally and trigger
"querying against a released/concurrent connection" warnings, so the parallel
form is both slower and noisier than the serial form.

```typescript
// Correct — sequential, one query at a time on the shared connection.
for (const id of ids) {
  await getCategoryById(tx, groupId, id);
}

// Wrong — pg-promise serializes these anyway and emits warnings.
await Promise.all(ids.map(id => getCategoryById(tx, groupId, id)));
```

This applies to anything that ultimately calls `tx.one/none/many/...`, including
helpers like `getCategoryById`, `getSourceById`, `getUserById`, and any data-layer
function that takes a `DbTask`. Avoid `tx.batch(...)` for the same reason: prefer
the explicit `for`-loop, which keeps the call shape uniform with the rest of the
data layer and makes the per-iteration trace span easy to read.

## Group Scoping (Multi-Tenant Isolation)

The app is multi-tenant: every group's data lives in shared tables, isolated only by
`group_id`. An endpoint that forgets to constrain by `session.group.id` can read or
mutate another group's data even when authenticated correctly. This is the single most
important class of bug the conventions guard against.

**Rule:** any endpoint declared with `groupRequired: true` must, in every DB query it
runs, constrain group-scoped tables by `group_id = $/groupId/` where `groupId` is
`session.group.id`. This applies to `SELECT`, `UPDATE`, and `DELETE` alike — not just
reads.

```typescript
// Correct — group_id is part of every WHERE / RETURNING clause that names a
// group-scoped table.
await tx.none(
  `UPDATE expenses
      SET subscription_id = NULL
      WHERE subscription_id = $/subscriptionId/ AND group_id = $/groupId/`,
  { subscriptionId, groupId },
);

// Wrong — relies on the caller having validated ownership; one missed call site
// upstream and a malicious client can mutate any group's rows by guessing IDs.
await tx.none(
  `UPDATE expenses SET subscription_id = NULL WHERE subscription_id = $/subscriptionId/`,
  { subscriptionId },
);
```

**Apply the rule to every group-scoped table.** Tables currently in scope:
`expenses`, `expense_division`, `subscriptions`, `categories`, `sources`, `shortcuts`,
`expense_groupings`, `tracked_subjects`, `users` (via `group_users`), and any new
table that carries a `group_id` column. If a new table is added without a `group_id`,
ask whether it really should be group-scoped before merging.

**Cross-table queries (joins, subselects, `IN (SELECT …)`)** must constrain the
group-scoped side too — a `DELETE FROM expense_division WHERE expense_id IN (SELECT id
FROM expenses WHERE …)` is only safe if the inner `SELECT` has `group_id =
$/groupId/`. Verify the constraint travels through every layer of the query.

**Defense in depth.** Even when a helper like `getExpenseById(tx, groupId, …)` has
already verified ownership, the follow-up `UPDATE` / `DELETE` must still include
`group_id = $/groupId/`. The two checks are not redundant: an upstream refactor that
drops the ownership check will leave the query safe, and a single audited query is
easier to review than a chain of "this is safe because the caller checked X".

**Untrusted IDs in the body.** When a request body carries IDs that name other rows
(`defaults.categoryId`, `defaults.sourceId`, `defaults.userId`, expense category and
source IDs, etc.), resolve them through a group-scoped helper (`getCategoryById`,
`getSourceById`, `getUserById`) before writing. Zod validates *shape*, not
*ownership* — without the lookup, a Zod-valid payload can pull an ID out of another
group.

**Endpoints without `groupRequired: true`** (login, public health checks, profile
endpoints scoped to `session.user.id`) are exempt by definition, but should still
constrain by `user_id` or whatever scope the route actually uses. The rule is "every
query carries the smallest scope the endpoint owns" — group scope is the most common
case, not the only one.

When reviewing or writing a data-layer function, the checklist is:

1. Does the function take `groupId` as a parameter? If a group-scoped table is
   touched, it must.
2. Does every `WHERE` / `RETURNING` clause on a group-scoped table include
   `group_id = $/groupId/`?
3. Do cross-table predicates (`IN (SELECT …)`, joins) constrain the group-scoped
   side too?
4. Are foreign-key IDs from the request body resolved through a group-scoped lookup
   before they're written?

If the answer to any of these is "no", fix it before the change ships — silently
relying on upstream checks is the failure mode this rule exists to prevent.

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

`captureTestState()` records a DB-side `NOW()`, the current `MAX(categories.id)`, and
`MAX(subscriptions.id)`. `cleanupTestDataSince()` then, scoped to the test group:

- NULLs `subscription_id` on test-created expenses (breaks the FK link to
  `subscriptions` so the next step can delete the expense).
- Deletes `expenses` created after the captured timestamp (cascades to `expense_division`).
- Deletes `subscriptions` rows with `id > maxRecurringId` so test-created
  recurring/report rows do not leak into later runs (the original cascade via
  `template_expense_id` is gone now that templates have been removed).
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
