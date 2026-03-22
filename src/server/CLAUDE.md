# Backend: Express + pg-promise

## Validated Router Pattern

API endpoints use `createValidatingRouter` with Zod schemas and automatic transactions:

```typescript
const api = createValidatingRouter(Router());

api.getTx(
  '/path/:id',
  { query: QuerySchema, response: ResponseSchema },
  (tx, session, { params, query }) => dbFunction(tx, session.group.id, params.id),
  true, // groupRequired
);
```

- `getTx`/`postTx`/`putTx`/`deleteTx` — run in a database transaction
- Session is auto-extracted and validated
- API handlers go in `src/server/api/*Api.ts`
- DB functions go in `src/server/data/*Db.ts` or `*Service.ts`

## Database Operations

The full database schema is documented in `docs/SCHEMA.sql`. Refer to it for table
structures, indexes, and constraints.

All DB functions take `tx: ITask<any>` as first parameter. Use pg-promise parameterized
queries:

```typescript
const result = await tx.oneOrNone<MyType>(
  `SELECT * FROM my_table WHERE id = $/id/ AND group_id = $/groupId/`,
  { id, groupId },
);
```

Query methods: `one()`, `oneOrNone()`, `many()`, `manyOrNone()`, `none()`, `map()`.
