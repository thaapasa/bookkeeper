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
│   │   ├── statistics/    # Charts and statistics
│   │   ├── subscriptions/ # Recurring expense management
│   │   ├── theme/         # Mantine theme
│   │   ├── tools/         # Admin tools (DB status, tooling buttons)
│   │   ├── tracking/      # Value tracking
│   │   └── utils/         # UI-layer helpers (classNames, Navigation, ...)
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
│   ├── time/         # Branded ISODate/ISOTimestamp types and conversions
│   ├── types/        # Common TypeScript types and Zod schemas
│   ├── userData/     # User data types
│   └── util/         # General utilities (Money, Arrays, etc.)
│
├── integration/      # Integration tests (require running dev server)
├── test/             # Test utilities
└── tools/            # Development tools and scripts

config/               # Legacy SQL snippets (schema, example data, queries)
docs/                 # Documentation (ARCHITECTURE.md, SCHEMA.sql, archived plans)
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

## Database

- **PostgreSQL** database
- Schema defined in `docs/SCHEMA.sql`
- Migrations in `migrations/` using Knex
- Key tables: `expenses`, `expense_division`, `users`, `groups`, `categories`, `sources`

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
