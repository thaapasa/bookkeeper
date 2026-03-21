# Kukkaro (Bookkeeper)

Personal expense tracking web app for shared households. Tracks expenses, income, and transfers between users with split/division tracking. Finnish-language UI.

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

### Backend: Validated Router Pattern

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

### Backend: Database Operations

The full database schema is documented in [`docs/SCHEMA.sql`](../docs/SCHEMA.sql). Refer to it for table structures, indexes, and constraints.

All DB functions take `tx: ITask<any>` as first parameter. Use pg-promise parameterized queries:

```typescript
const result = await tx.oneOrNone<MyType>(
  `SELECT * FROM my_table WHERE id = $/id/ AND group_id = $/groupId/`,
  { id, groupId },
);
```

Query methods: `one()`, `oneOrNone()`, `many()`, `manyOrNone()`, `none()`, `map()`.

### Frontend: UI Framework (Mantine 8)

**The codebase is being migrated from MUI/Emotion to Mantine 8.** Much of the existing
UI code still uses the old stack (Emotion `styled`, MUI components, custom CSS). This
old code is legacy — do NOT use it as an example for new code.

#### Rules for new and modified UI code

1. **Use Mantine components** (`Text`, `Group`, `Stack`, `Box`, `ActionIcon`, `Button`,
   `Paper`, `Container`, `ScrollArea`, `AppShell`, etc.) instead of raw HTML elements
   or custom styled wrappers.
2. **Use Mantine style props** (`p`, `m`, `fz`, `fw`, `c`, `bg`, `w`, `h`, etc.) for
   simple styling. These go directly on Mantine components.
3. **Use Mantine `style` prop** for one-off CSS properties not covered by style props.
4. **Only use custom CSS (Emotion `styled` or CSS files) when clearly required** — for
   example, complex pseudo-elements, the app's custom media-query breakpoints
   (`media.mobile`, `media.mobilePortrait`), or CSS patterns like diagonal stripes that
   have no Mantine equivalent.
5. **Do NOT create new Emotion `styled` wrappers** for things Mantine handles natively
   (padding, margins, colors, font sizes, flex layout, visibility, etc.).
6. **Do NOT wrap Mantine components with `styled()`** — Emotion's `styled()` does not
   forward Mantine's polymorphic props correctly. Use `styled.div` / `styled.span` if
   you must use Emotion, or prefer Mantine's `style`/`styles` props.
7. **Replace legacy patterns when touching a file.** If you're modifying a component that
   uses `styled` for simple layout, convert those parts to Mantine as part of the change.

#### What "legacy code" looks like (don't copy these patterns)

- `import styled from '@emotion/styled'` with simple layout wrappers
- `import { Button, Box } from '@mui/material'` (MUI imports)
- Custom `VCenterRow`, `Flex` from `GlobalStyles.ts` — use Mantine `Group` / `Flex`
- `PageContentContainer` — deleted, use `ScrollArea`
- Inline style objects for margins/padding — use Mantine style props

#### Mantine reference

- Theme: `src/client/ui/theme/mantineTheme.ts` — custom colors (`primary`, `neutral`,
  `action`, `income`), dark mode via virtualColor
- Font sizes: Smaller than Mantine defaults (xs=10, sm=12, md=14, lg=16, xl=18).
  Use `md` for normal UI text, `sm` for dense data tables, `xs` for minor labels.
- Layout: `BookkeeperPage.tsx` — `AppShell` + `Container` (no card wrapper)
- Custom breakpoints: The app uses `media.mobile` (< 840px) and `media.mobilePortrait`
  (< 600px) from `client/ui/Styles`. These do NOT match Mantine's built-in breakpoints,
  so use Emotion `styled` + `media.*` for responsive hiding at these thresholds.

### Frontend: State & Data

- **API calls**: `apiConnect` singleton (`client/data/ApiConnect.ts`)
- **Async loading**: `useAsyncData(loader, enabled, ...deps)` hook
- **State**: Zustand (preferred for new code), Bacon.js reactive streams (legacy)
- **Dialogs**: `UserPrompts.confirm()`, `UserPrompts.promptText()`

## Key Conventions

### Type Definitions

Define Zod schema and derive TypeScript type in `src/shared/`:

```typescript
export const MyInput = z.object({ name: z.string().trim().min(1) });
export type MyInput = z.infer<typeof MyInput>;
```

Use existing primitives: `ObjectId`, `ObjectIdString`, `IntString`, `ISODateString`.

### Money

Always use `Money` from `shared/util` for monetary values (wraps Big.js). Never use floating-point arithmetic for money.

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

- **expense**: split into `cost` (who paid, sums to −expense.sum) and `benefit` (who benefits, sums to +expense.sum)
- **income**: split into `income` (who received) and `split` (who benefits)
- **transfer**: split into `transferor` and `transferee`

For each expense, `sum(expense_division.sum) = 0` always holds.
