---
description: Backend coding conventions for the Express + pg-promise server
globs:
  - src/server/**/*.ts
  - migrations/**/*.js
---

# Backend conventions

## Validated Router Pattern

All API endpoints use `createValidatingRouter` with Zod schemas and automatic transactions:

```typescript
const api = createValidatingRouter(Router());

api.getTx(
  '/path/:id',
  { query: QuerySchema, response: ResponseSchema },
  (tx, session, { params, query }) => dbFunction(tx, session.group.id, params.id),
  true, // groupRequired
);
```

- `getTx`/`postTx`/`putTx`/`deleteTx` — run handler in a database transaction
- `get`/`post`/`put`/`delete` — for non-database operations
- Always specify Zod schemas for `query`, `body`, and `response`
- Set `groupRequired` to `true` for endpoints needing group context
- API handlers: `src/server/api/*Api.ts`
- DB functions: `src/server/data/*Db.ts` or `*Service.ts`

## Database Operations

Schema reference: `docs/SCHEMA.sql`

All DB functions take `tx: DbTask` (from `server/data/Db`) as first parameter. Use
pg-promise parameterized queries with `$/paramName/` syntax:

```typescript
const result = await tx.oneOrNone<MyType>(
  `SELECT * FROM my_table WHERE id = $/id/ AND group_id = $/groupId/`,
  { id, groupId },
);
```

Query methods: `one()`, `oneOrNone()`, `many()`, `manyOrNone()`, `none()`, `map()`.

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

- API handlers: `*Api.ts`
- Database operations: `*Db.ts` or `*Service.ts`
- Types and schemas: Named by domain in `src/shared/`
