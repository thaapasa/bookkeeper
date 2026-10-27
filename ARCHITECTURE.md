# Kukkaro Architecture

This document provides an overview of the codebase architecture, directory structure, and technology stack.

## Technology Stack

### Runtime & Build Tools

- **Bun** - JavaScript/TypeScript runtime and package manager
- **Vite** - Frontend build tool and dev server
- **TypeScript** - Static typing throughout the codebase

### Backend

- **Express** - HTTP server framework
- **pg-promise** - PostgreSQL client with transaction support
- **Zod** - Schema validation for API endpoints and data types
- **Pino** - Structured JSON logging
- **Knex** - Database migrations

### Frontend

- **React 19** - UI framework (functional components with hooks)
- **Mantine 9** - Component library and styling (CSS modules)
- **React Router 7** - Client-side routing
- **Zustand** - State management
- **TanStack Query** - Data fetching and caching
- **Recharts** - Charts and data visualization
- **Luxon** - Date/time manipulation

### Shared Libraries

- **Big.js** - Precise decimal arithmetic for money calculations
- **Zod** - Schema definitions shared between client and server

## Directory Structure

```
src/
├── client/           # Frontend React application
│   ├── App.tsx       # Root application component
│   ├── Config.ts     # Client configuration
│   ├── Logger.ts     # Browser logger
│   ├── css/          # App-level CSS (mobile rem bump, layer ordering)
│   ├── data/         # Zustand stores, TanStack Query setup, API client
│   ├── ui/           # React components organized by feature
│   │   ├── category/      # Category management
│   │   ├── chart/         # Recharts wrappers
│   │   ├── component/     # Shared UI components (boundaries, inputs, icons)
│   │   ├── design/        # Shared text primitives (Title, Subtitle, ...)
│   │   ├── dialog/        # Modal dialog infrastructure
│   │   ├── expense/       # Expense CRUD and display
│   │   ├── general/       # Standalone pages (Login, ShortcutsPage, ErrorView)
│   │   ├── grouping/      # Expense groupings
│   │   ├── hooks/         # Custom React hooks
│   │   ├── icons/         # Lucide icon map and ExpenseType icons
│   │   ├── info/          # App info / about views
│   │   ├── layout/        # AppShell, PageLayout, TopBar, AppRouter
│   │   ├── profile/       # User profile management
│   │   ├── reports/       # Saved reports
│   │   ├── search/        # Expense search
│   │   ├── shortcuts/     # Quick expense shortcuts
│   │   ├── statement/     # Bank statement import + reconciliation (docs/BANK_STATEMENTS.md)
│   │   ├── statistics/    # Charts and statistics
│   │   ├── subscriptions/ # Recurring expense management
│   │   ├── theme/         # Mantine theme
│   │   ├── tools/         # Admin tools (DB status, tooling buttons)
│   │   ├── tracking/      # Value tracking
│   │   ├── utils/         # UI-layer helpers (classNames, Navigation, ...)
│   │   └── yearly/        # Yearly income vs expense overview
│   └── util/         # Non-UI client utilities (ApiConnect helpers, Links)
│
├── server/           # Backend Express server
│   ├── BookkeeperServer.ts  # Entry point
│   ├── Config.ts     # Environment/config loader
│   ├── Logger.ts     # Pino logger (server-side)
│   ├── api/          # REST API route handlers
│   ├── content/      # Static content (uploads, generated webp variants)
│   ├── data/         # Database operations (pg-promise queries + services)
│   ├── logging/      # Trace ID / request tracing
│   ├── notifications/ # Slack notifications
│   ├── server/       # Express setup, middleware, ValidatingRouter
│   ├── telemetry/    # OpenTelemetry setup and OTLP routing
│   └── util/         # Server-side utilities
│
├── shared/           # Code shared between client and server
│   ├── expense/      # Expense types and utilities
│   ├── math/         # Number and percentage utilities
│   ├── net/          # HTTP client and URL utilities
│   ├── statement/    # Bank statement types, parsers, matcher (docs/BANK_STATEMENTS.md)
│   ├── time/         # Branded ISODate/ISOTimestamp types and conversions
│   ├── types/        # Common TypeScript types and Zod schemas
│   ├── userData/     # User data types
│   └── util/         # General utilities (Money, Arrays, etc.)
│
├── integration/      # Integration tests (require running dev server)
├── test/             # Test utilities
└── tools/            # Development tools and scripts

config/               # Legacy SQL snippets (schema, example data, queries)
docs/                 # Feature docs, SCHEMA.sql, archived plans
migrations/           # Knex migration files (raw SQL in knex.raw())
```

## Key Architectural Patterns

### API Layer

The server uses a **validated router pattern** with Zod schemas:

```typescript
// In src/server/api/*.ts
api.getTx(
  '/month',
  { query: YearMonth, response: ExpenseCollection, groupRequired: true },
  (tx, session, { query }) =>
    getExpensesByMonth(tx, session.group.id, session.user.id, query.year, query.month),
);
```

- `getTx`, `postTx`, `putTx`, `deleteTx` — methods that run within a database transaction.
- `get`, `post`, `put`, `delete` — for non-database operations.
- Request/response validation via Zod schemas (`query`, `body`, `response`).
- Session is automatically extracted and validated; set `groupRequired: true` in the
  spec when the handler needs group context.
- Path parameters are type-safe based on the route pattern.

### Database Layer

Database operations use **pg-promise** with transaction support:

```typescript
// In src/server/data/*.ts
export async function getExpenseById(
  tx: DbTask,
  groupId: number,
  userId: number,
  expenseId: number,
): Promise<UserExpense> {
  const expense = await tx.map(
    expenseSelectClause(`WHERE e.id=$/expenseId/ AND e.group_id=$/groupId/`),
    { userId, expenseId, groupId },
    dbRowToExpense,
  );
  if (!expense || expense.length < 1) {
    throw new NotFoundError('EXPENSE_NOT_FOUND', 'expense');
  }
  return expense[0];
}
```

- All DB functions receive a transaction object (`tx: DbTask` from `server/data/Db`)
- Use parameterized queries with `$/paramName/` syntax
- Map functions transform DB rows to typed objects

### Frontend Components

React components use **functional components with hooks**:

```tsx
// In src/client/ui/*.tsx
export const MyComponent: React.FC<Props> = ({ prop1, prop2 }) => {
  const [state, setState] = React.useState<Type>(initial);

  React.useEffect(() => {
    // Side effects
  }, [dependencies]);

  return (
    <Stack gap="md" p="md">
      {/* JSX */}
    </Stack>
  );
};
```

### Styling

Uses **Mantine style props** and **CSS modules**:

```tsx
<Stack gap="md" p="md">
  <Group justify="space-between" px={{ base: 'xs', sm: 'md' }}>
    <Text fz="sm" c="primary.7">
      Label
    </Text>
  </Group>
</Stack>
```

### State Management

- **TanStack Query** for server data fetching and caching. Data-loading pages use
  `useSuspenseQuery` wrapped in a `QueryBoundary` (from
  `src/client/ui/component/QueryBoundary.tsx`) so components only render the happy
  path — loading, error, and background refetch indication are handled by the
  boundary and `IsFetchingBar`. `useQuery` is still used for ad-hoc fetches that
  must not suspend (e.g. `SearchPage`).
- **Zustand** for client state management (session, navigation, notifications,
  expense dialog state).
- **React state** for component-local logic.

### API Client

The frontend uses a **typed API client**:

```typescript
// In src/client/data/ApiConnect.ts
public storeExpense(expense: ExpenseData): Promise<ApiMessage> {
  return this.post<ApiMessage>('/api/expense', { body: expense });
}
```

## Type System

### Shared Types

Types are defined in `src/shared/types/` using Zod schemas that work on both client and server:

```typescript
// Define schema
export const ExpenseInput = z.object({
  type: ExpenseType,
  title: z.string(),
  sum: MoneySchema,
  // ...
});

// Derive TypeScript type
export type ExpenseInput = z.infer<typeof ExpenseInput>;
```

### Money Handling

Money values use **Big.js** for precise decimal arithmetic:

```typescript
import { Money } from 'shared/util';

const sum = Money.from('100.50');
const total = sum.plus('25.00');
const formatted = Money.toString(total); // "125.50"
```

### Date and Time Handling

No JS `Date` objects anywhere in the codebase. Dates and timestamps use **branded string
types** at all boundaries (API, DB, component props):

- `ISODate` — calendar dates (`"2026-04-09"`)
- `ISOMonth` — year-month (`"2026-04"`)
- `ISOTimestamp` — ISO 8601 with timezone (`"2026-04-09T12:00:00.000+03:00"`)

**Luxon `DateTime`** is used for computation only — never stored, serialized, or passed
across API boundaries.

Custom pg type parsers in `Db.ts` convert at the database boundary so pg-promise never
returns JS `Date` objects. `DATE` columns become `ISODate` strings, `TIMESTAMPTZ` columns
become `ISOTimestamp` strings, and `TIMESTAMP` (without timezone) throws an error.

When writing to the database, always pass explicit strings (`toISODate()`,
`toISOTimestamp()`), never raw `DateTime` objects. Use `NOW()` in SQL for server-side
timestamps.

Utilities: `shared/time/` (conversion, parsing, formatting). See
`docs/archive/DATE_HANDLING.md` for historical context and antipatterns.

## Sum and balance calculation

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

## Database

- **PostgreSQL** database
- Schema defined in `docs/SCHEMA.sql`
- Migrations in `migrations/` using Knex
- Key tables: `expenses`, `expense_division`, `users`, `groups`, `categories`, `sources`,
  and the bank statement tables `statement_upload`, `statement_row`, `statement_match`
  (see `docs/BANK_STATEMENTS.md`)

## Error Handling

Custom error types in `src/shared/types/Errors.ts`:

```typescript
throw new NotFoundError('EXPENSE_NOT_FOUND', 'expense');
throw new AuthenticationError('Invalid credentials');
```

## Import Aliases

TypeScript path aliases configured in `tsconfig.json`:

- `shared/*` → `src/shared/*`
- `client/*` → `src/client/*`
- `server/*` → `src/server/*`

## Logging

Server uses **Pino** for structured logging:

```typescript
import { logger } from 'server/Logger';

logger.info({ expenseId }, 'Expense created');
logger.error(error, 'Failed to save expense');
```

Client has a simpler logger in `src/client/Logger.ts`.
