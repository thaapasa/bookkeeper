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

- **React 18** - UI framework (functional components with hooks)
- **Material UI (MUI) 5** - Component library and styling
- **Emotion** - CSS-in-JS styling (via MUI's styled API)
- **React Router 6** - Client-side routing
- **Zustand** - State management
- **Bacon.js** - Reactive programming for data streams
- **Recharts** - Charts and data visualization
- **Day.js** - Date manipulation

### Shared Libraries

- **Big.js** - Precise decimal arithmetic for money calculations
- **Zod** - Schema definitions shared between client and server

## Directory Structure

```
src/
├── client/           # Frontend React application
│   ├── App.tsx       # Root application component
│   ├── Config.ts     # Client configuration
│   ├── data/         # State management, API connection, login handling
│   ├── ui/           # React components organized by feature
│   │   ├── category/     # Category management
│   │   ├── component/    # Shared UI components
│   │   ├── dialog/       # Modal dialogs
│   │   ├── expense/      # Expense CRUD and display
│   │   ├── general/      # Layout and page components
│   │   ├── grouping/     # Expense groupings
│   │   ├── hooks/        # Custom React hooks
│   │   ├── icons/        # Custom icon components
│   │   ├── profile/      # User profile management
│   │   ├── search/       # Expense search
│   │   ├── shortcuts/    # Quick expense shortcuts
│   │   ├── statistics/   # Charts and statistics
│   │   ├── subscriptions/ # Recurring expense management
│   │   └── tracking/     # Value tracking
│   └── util/         # Client-side utilities
│
├── server/           # Backend Express server
│   ├── BookkeeperServer.ts  # Entry point
│   ├── api/          # REST API route handlers
│   ├── content/      # Static content serving
│   ├── data/         # Database operations
│   ├── server/       # Server setup and middleware
│   ├── logging/      # Request tracing
│   └── notifications/ # Slack notifications
│
├── shared/           # Code shared between client and server
│   ├── expense/      # Expense types and utilities
│   ├── math/         # Number and percentage utilities
│   ├── net/          # HTTP client and URL utilities
│   ├── time/         # Date/time utilities
│   ├── types/        # Common TypeScript types and Zod schemas
│   ├── userData/     # User data types
│   └── util/         # General utilities (Money, Arrays, etc.)
│
├── integration/      # Integration tests
├── test/             # Test utilities
└── tools/            # Development tools and scripts

config/               # Database schema and example queries
migrations/           # Knex migration files
```

## Key Architectural Patterns

### API Layer

The server uses a **validated router pattern** with Zod schemas:

```typescript
// In src/server/api/*.ts
api.getTx(
  '/month',
  { query: YearMonth, response: ExpenseCollection },
  (tx, session, { query }) =>
    getExpensesByMonth(tx, session.group.id, session.user.id, query.year, query.month),
  true,
);
```

- `getTx`, `postTx`, `putTx`, `deleteTx` - Methods that run within a database transaction
- Request/response validation via Zod schemas
- Session is automatically extracted and validated
- Path parameters are type-safe based on the route pattern

### Database Layer

Database operations use **pg-promise** with transaction support:

```typescript
// In src/server/data/*.ts
export async function getExpenseById(
  tx: ITask<any>,
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

- All DB functions receive a transaction object (`tx: ITask<any>`)
- Use parameterized queries with `$/paramName/` syntax
- Map functions transform DB rows to typed objects

### Frontend Components

React components use **functional components with hooks**:

```typescript
// In src/client/ui/*.tsx
export const MyComponent: React.FC<Props> = ({ prop1, prop2 }) => {
  const [state, setState] = React.useState<Type>(initial);
  
  React.useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  return (
    <StyledContainer>
      {/* JSX */}
    </StyledContainer>
  );
};
```

### Styling

Uses **MUI's styled API** with Emotion:

```typescript
import { styled } from '@mui/material';

const StyledContainer = styled('div')`
  display: flex;
  flex-direction: column;
  padding: 16px;
  
  ${media.mobile`
    padding: 8px;
  `}
`;
```

### State Management

- **Bacon.js** for reactive data streams (legacy pattern, still used)
- **Zustand** for simpler state management (preferred for new code)
- **Custom hooks** for async data loading (`useAsyncData`)

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

## Database

- **PostgreSQL** database
- Schema defined in `config/schema.sql`
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
