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

## Date and Time Handling (DB <-> Server)

Custom pg type parsers in `Db.ts` convert date/time values at the database boundary:

**Output (DB -> JS):**

- `DATE` -> `ISODate` string (pass-through, e.g. `"2026-04-09"`)
- `TIMESTAMPTZ` -> `ISOTimestamp` string (via `DateTime.fromSQL().toISO()`)
- `TIMESTAMP` (without tz) -> **throws** (schema must use `TIMESTAMPTZ`)

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

## After Making Changes

Always run `bun format` then `bun lint` to verify.
