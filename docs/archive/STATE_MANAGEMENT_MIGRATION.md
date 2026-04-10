# State Management Migration: Bacon.js to Zustand + TanStack Query

> **Status: COMPLETED** — April 2026. All Bacon.js streams replaced with
> Zustand stores and TanStack Query, `AsyncData` type removed, `baconjs`
> dependency deleted. This document is retained as a historical decision record.
>
> Tracking issue: [thaapasa/bookkeeper#89](https://github.com/thaapasa/bookkeeper/issues/89)

## Prior State

The frontend used three distinct state management patterns that evolved organically
over time.

### Bacon.js — Global Reactive State

Bacon.js is an FRP (functional reactive programming) library that predates React hooks.
The app used it for global state that many components needed:

- **Session and user data** (`Login.ts`, `Categories.ts`): `sessionBus`/`sessionP`,
  `validSessionP`, derived maps (`userMapP`, `sourceMapP`, `categoryMapP`, etc.)
- **Navigation** (`State.ts`): `navigationBus`/`navigationP` for current date range
  and view state
- **Dialogs and events** (`State.ts`, `DialogState.ts`): `expenseDialogBus`,
  `expenseSplitBus`, `notificationBus`, `dialogActionBus` — Promise-based dialog
  resolution
- **Data refresh signaling** (`State.ts`): `needUpdateBus` — fired after mutations
  to tell components to refetch
- **React integration**: `useBaconProperty`, `useBaconState` hooks, `connectDialog` HOC
  — used in 28+ components

**Problems**: unmaintained library, state outside React lifecycle, manual cache
invalidation via `needUpdateBus`, derived properties doing what Zustand selectors or
`useMemo` could do natively.

### Zustand — Complex Form/Editor State

Already used for multi-field editor forms with validation and async save operations:
`useGroupingState`, `useShortcutState`, `useTrackingState`, `useUserDataState`,
`usePasswordState`. This layer was well-suited to its purpose and kept as-is.

### useAsyncData / useDeferredData — Data Loading

Custom hooks returning `AsyncData<T>` (discriminated union of uninitialized/loading/
loaded/error). Used by `MonthView`, `CategoryView`, `SubscriptionsPage`, etc.

**Problems**: no caching (navigating away and back refetched everything), no
deduplication, no background refetching, manual invalidation via `needUpdateBus`,
no optimistic updates.

## Alternatives Evaluated

### TanStack Query (React Query) — chosen for server state

Declarative data fetching with automatic caching, deduplication, background refetching,
and mutation-based cache invalidation. Replaces `useAsyncData`, `needUpdateBus`, and
the manual refetch pattern.

- (+) Handles caching, deduplication, refetching, error/loading states, retries
- (+) Mutation → invalidation replaces `needUpdateBus` with a declarative model
- (+) Stale-while-revalidate eliminates flash-of-loading on back-navigation
- (-) ~40kb gzipped, learning curve around cache keys and stale time

### Zustand for client state — chosen for Bacon.js replacement

Already in the codebase. Simple API, small bundle, excellent TypeScript support.
Selectors for derived state replace Bacon.js derived properties.

### React Router Data Loaders — deferred

Data fetching starts on navigation (click) instead of component mount. Would require
migrating from `<BrowserRouter>` to `createBrowserRouter`. Deferred as a potential
future enhancement — the benefit is mostly cosmetic with query caching in place.

### React Suspense — partially adopted

Complement to TanStack Query, not an alternative. `useSuspenseQuery` available for
pages that benefit from declarative loading boundaries.

### Jotai — not chosen

Atomic model conceptually similar to Bacon.js properties, but would add a third state
library alongside Zustand. Less ecosystem tooling.

### Redux Toolkit + RTK Query — not chosen

Significantly more boilerplate than Zustand + TanStack Query. Overkill for this app's
complexity.

## Target Architecture

```
+------------------------------------------------------------------+
|                        Data Layers                                |
|                                                                   |
|  Server Data (TanStack Query)     Client State (Zustand)          |
|  ┌─────────────────────────┐      ┌──────────────────────────┐    |
|  │ expenses, categories,   │      │ session, navigation,     │    |
|  │ subscriptions, stats,   │      │ dialog state,            │    |
|  │ tracking data, search   │      │ notifications,           │    |
|  │ results, user profiles  │      │ UI preferences           │    |
|  └─────────────────────────┘      └──────────────────────────┘    |
|         │                                │                        |
|    useQuery / useMutation          useStore / selectors            |
|         │                                │                        |
|  ┌──────┴────────────────────────────────┴──────────────────┐     |
|  │                    React Components                       │    |
|  └───────────────────────────────────────────────────────────┘    |
|                                                                   |
|  Form/Editor State (Zustand) — kept as-is                         |
|  ┌──────────────────────────────────────────────────────────┐     |
|  │ GroupingEditorState, ShortcutEditorState, etc.            │    |
|  └──────────────────────────────────────────────────────────┘     |
+------------------------------------------------------------------+
```

- **Server data** (TanStack Query): expenses, categories, subscriptions, stats,
  tracking data, search results. Query keys organized by domain
  (`['expenses', 'month', '2026-04']`). Mutations invalidate related query keys.
- **Client state** (Zustand): session, navigation, dialog triggers, notifications.
  Imperative function APIs (`notify()`, `editExpense()`, `UserPrompts.confirm()`)
  preserved via `getState()`.
- **Form state** (Zustand): existing editor stores kept as-is.
- **Component-local state** (React): form fields, search filters, UI toggles.

## Migration Phases

### Phase 1: Add TanStack Query Infrastructure

Added `@tanstack/react-query` with `QueryClientProvider`, query key conventions in
`client/data/queryKeys.ts`, and invalidation helpers (`invalidateExpenseData()`,
`invalidateSubscriptionData()`).

### Phase 2: Migrate Data Loading

Replaced `useAsyncData`/`useDeferredData` with `useQuery` hooks. Each component's
data source became a query function with proper cache keys and stale times.

### Phase 3: Migrate Mutations (Replace needUpdateBus)

Replaced `needUpdateBus` with TanStack Query's `invalidateQueries` called from
`executeOperation` post-processing.

### Phase 4: Migrate Session State to Zustand

Created `SessionStore.ts` replacing Bacon.js session properties with `useSessionStore`
hook and convenience selectors (`useValidSession`, `useCategoryMap`, `useSourceMap`).

### Phase 5: Remove All Remaining Bacon.js

The largest phase. Replaced 11 files still importing `baconjs`. Created new Zustand
stores for navigation (`NavigationStore.ts`), notifications (`NotificationStore.ts`),
and expense dialogs (`ExpenseDialogStore.ts`). Rewrote complex reactive form logic
in `useExpenseDialog.ts` (12+ field buses → `useState`/`useMemo`) and `QueryView.tsx`
(8 buses → React state + refs). Replaced Bacon.js debounce in `ReceiverField.tsx` with
`setTimeout` + `AbortController`. Deleted `DialogConnector.tsx`, `useBaconState.ts`,
`usePersistentMemo.ts`, `useWhenMounted.ts`. Removed `baconjs` dependency.

Key design decisions:
- Zustand for cross-component state, React state for local logic
- Imperative function APIs preserved (no consumer changes needed)
- Promise-based dialog pattern preserved via Zustand stores
- Seq-based event signaling for cross-month navigation triggers

### Phase 6: Remove AsyncData

Replaced `AsyncData<T>` discriminated union with plain `boolean` for save-in-progress
tracking. Deleted `src/client/data/AsyncData.ts`.
