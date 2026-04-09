# Backend: Express + pg-promise

## Validated Router Pattern

API endpoints use `createValidatingRouter` with Zod schemas and automatic transactions:

```typescript
const api = createValidatingRouter(Router());

api.getTx(
  '/path/:id',
  { query: QuerySchema, response: ResponseSchema, groupRequired: true },
  (tx, session, { params, query }) => dbFunction(tx, session.group.id, params.id),
);
```

- `getTx`/`postTx`/`putTx`/`deleteTx` — run in a database transaction
- Session is auto-extracted and validated
- API handlers go in `src/server/api/*Api.ts`
- DB functions go in `src/server/data/*Db.ts` or `*Service.ts`

## Code Quality: Be Proactive

When working on any file, **actively look for bad code** in that file and nearby code.
Wrong idioms (raw SQL without parameterization, `any` types, missing Zod validation,
floating-point money, untyped error handling), code smells, and missing best practices
should all be flagged. Fix issues that are in scope; for out-of-scope issues, always ask
whether to include the fix. No bad code should go unmentioned.

## Database Operations

The full database schema is documented in `docs/SCHEMA.sql`. Refer to it for table
structures, indexes, and constraints. If a local DB is available, you can also inspect
the live schema via `psql "$DB_URL"` (connection string is in `.env`).

All DB functions take `tx: DbTask` (from `server/data/Db`) as first parameter. Use
pg-promise parameterized queries:

```typescript
const result = await tx.oneOrNone<MyType>(
  `SELECT * FROM my_table WHERE id = $/id/ AND group_id = $/groupId/`,
  { id, groupId },
);
```

Query methods: `one()`, `oneOrNone()`, `many()`, `manyOrNone()`, `none()`, `map()`.

## Date and Time Handling (DB ↔ Server)

Custom pg type parsers in `Db.ts` convert date/time values at the database boundary:

**Output (DB → JS):**

- `DATE` → `ISODate` string (pass-through, e.g. `"2026-04-09"`)
- `TIMESTAMPTZ` → `ISOTimestamp` string (via `DateTime.fromSQL().toISO()`)
- `TIMESTAMP` (without tz) → **throws** (schema must use `TIMESTAMPTZ`)

**Input (JS → DB):**

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
