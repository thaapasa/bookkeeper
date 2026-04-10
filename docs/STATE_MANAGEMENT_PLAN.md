# Frontend State Management: Architecture Review and Migration Plan

Tracking issue: [thaapasa/bookkeeper#89](https://github.com/thaapasa/bookkeeper/issues/89)

## 1. Current Situation

The frontend uses three distinct state management patterns that evolved organically
over time. Each serves a different purpose but the boundaries are inconsistent, and
the oldest layer (Bacon.js) is a poor fit for modern React.

### 1.1 Bacon.js — Global Reactive State

Bacon.js is an FRP (functional reactive programming) library that predates React hooks.
The app uses it for global state that many components need:

**Session and user data** (`Login.ts`, `Categories.ts`):

- `sessionBus` / `sessionP` — current user session (logged-in user, group, permissions)
- `validSessionP` — filtered property with only authenticated sessions
- `userMapP`, `sourceMapP` — derived maps from session data
- `categoryMapP`, `categoryDataSourceP`, `expenseGroupingMapP` — category hierarchy,
  all derived from the session

**Navigation** (`State.ts`):

- `navigationBus` / `navigationP` — current date range and view state

**Dialogs and events** (`State.ts`, `DialogState.ts`):

- `expenseDialogBus` — expense editor modal state with Promise-based resolution
- `expenseSplitBus` — expense split dialog
- `notificationBus` — toast/notification events
- `dialogActionBus` — generic dialog actions (confirm, select, text input, etc.)

**Data refresh signaling** (`State.ts`):

- `needUpdateBus` — fired after mutations to tell components to refetch their data

**React integration:**

- `useBaconProperty(property)` — subscribes to a Bacon.js Property, returns current value
- `useBaconState(observable)` — subscribes to an Observable (value can be undefined)
- `connectDialog(bus, renderer)` — HOC connecting a Bacon.js bus to a React component
- Used in 28+ components

**Problems with Bacon.js in this role:**

- Bacon.js is unmaintained and conceptually foreign to React developers
- State lives outside React's lifecycle — no integration with Suspense, transitions, or
  concurrent features
- The `needUpdateBus` pattern is manual cache invalidation — error-prone, no guarantee
  that the right components refetch
- Dialog buses with Promise resolution are clever but hard to reason about compared to
  simple component state
- Derived properties (`categoryMapP` from `sessionP`) are doing what Zustand selectors
  or React `useMemo` could do natively

### 1.2 Zustand — Complex Form/Editor State

Zustand is used for multi-field editor forms with validation and async save operations:

- `useGroupingState` — expense grouping editor (title, categories, colors, dates, images)
- `useShortcutState` — shortcut editor (title, background, icon)
- `useTrackingState` — tracking subject editor (title, categories, chart config)
- `useUserDataState` — user profile form
- `usePasswordState` — password change form

Each store follows the same pattern: field state + setters + validation + async save
action that tracks `AsyncData` status.

**This layer is well-suited to its purpose.** Zustand is a good fit for complex form
state with many interdependent fields. No changes needed here.

### 1.3 useDeferredData / useAsyncData — Data Loading

Custom hooks in `useAsyncData.ts` for fetching server data in components:

- `useAsyncData(dataSource, valid, ...params)` — fetches automatically when params change
- `useDeferredData(dataSource, valid, ...params)` — same but requires manual `loadData()` call

Both return `AsyncData<T>` — a discriminated union of `Uninitialized | Loading | Loaded<T> | Error`.
Components render different states via the `AsyncDataView` component.

Used by: `MonthView`, `CategoryView`, `SubscriptionsPage`, `SubscriptionDetails`,
`CategoryRow`, `DbStatusView`.

**Problems:**

- No caching — navigating away and back refetches everything
- No deduplication — two components requesting the same data make two requests
- No background refetching — data gets stale
- Manual invalidation via `needUpdateBus` — after saving an expense, you have to remember
  to signal the bus, and every interested component must subscribe and call `loadData()`
- No optimistic updates — UI waits for server round-trip before showing changes
- Request cancellation is manual (ref-based tracking in the hook)

### 1.4 Other Patterns

- **React Context** — minimal use (only `DayParityContext` for row styling)
- **localStorage hooks** — `useLocalStorage`, `useLocalStorageList` for persisted
  preferences and filter state
- **useForceReload** — counter-based force-update hack (a symptom of missing proper
  reactivity)

---

## 2. Alternative Approaches

### 2.1 TanStack Query (React Query) — Server State

TanStack Query is the dominant solution for server state in React apps. It treats
server data as a cache that the app reads from and writes to.

**Core concepts:**

- **Queries** — declarative data fetching with automatic caching, deduplication, and
  background refetching. A query is identified by a key (e.g. `['expenses', '2026-04']`).
- **Mutations** — write operations that can invalidate related queries, triggering
  automatic refetch.
- **Stale-while-revalidate** — show cached data immediately while fetching fresh data
  in the background. Navigating back to a page shows instant content.
- **Query invalidation** — after a mutation, invalidate by key pattern
  (e.g. `invalidateQueries({ queryKey: ['expenses'] })` refetches all expense queries).
- **Optimistic updates** — update the cache before the server responds, roll back on error.

**Tradeoffs:**

- (+) Handles caching, deduplication, refetching, error/loading states, retries
- (+) Mutation → invalidation replaces `needUpdateBus` with a declarative model
- (+) DevTools for inspecting cache state
- (+) Huge ecosystem, well-documented, actively maintained
- (-) Another dependency (~40kb gzipped)
- (-) Learning curve around cache keys, invalidation strategies, and stale time config
- (-) Query key management can get complex in large apps

### 2.2 React Router Data Loaders

React Router v7 supports a "data router" pattern via `createBrowserRouter` where each
route can define a `loader` function that runs before the component renders.

**Core concepts:**

- **Loaders** — async functions tied to routes. Data fetching starts on navigation
  (on link click), not on component mount. Eliminates the render-then-fetch waterfall.
- **Actions** — form/mutation handlers tied to routes. After an action completes,
  all loaders on the page automatically re-run (revalidation).
- **useLoaderData()** — read the loader's result in the component. No loading state
  needed because data is available before the component renders.
- **useFetcher()** — for mutations that don't cause navigation.

**Tradeoffs:**

- (+) Data loading starts earlier (on click, not on mount) — faster perceived navigation
- (+) Automatic revalidation after actions — no manual invalidation
- (+) Integrates with Suspense for streaming/progressive rendering
- (-) Only works for route-level data — doesn't help with data loaded deeper in the
  component tree (expanding a row, search-as-you-type, infinite scroll)
- (-) No cross-navigation caching — going back to a page re-runs the loader
- (-) Requires migrating from `<BrowserRouter>` to `createBrowserRouter` (touches all routes)
- (-) Less flexible than TanStack Query for complex invalidation patterns

### 2.3 React Suspense with `use()` Hook

React 19 has first-class support for Suspense-based data fetching via the `use()` hook.

**Core concepts:**

- **`use(promise)`** — a hook that suspends the component until the promise resolves.
  The nearest `<Suspense>` boundary shows a fallback while suspended.
- **`<Suspense fallback={...}>`** — declarative loading boundaries. Components don't
  manage their own loading state; the boundary does.
- **Nested boundaries** — outer Suspense shows page skeleton, inner Suspense boundaries
  allow parts of the page to load independently.

**Tradeoffs:**

- (+) Declarative loading states — components only deal with the resolved data
- (+) Composable — nest boundaries for progressive loading
- (+) Built into React, no extra dependency
- (-) Not a data fetching solution — Suspense is a rendering mechanism. You still need
  something to create, cache, and manage the promises.
- (-) No mutation story — Suspense handles reads, not writes
- (-) Promise management is your responsibility without a library like TanStack Query

**Suspense is a complement to TanStack Query or router loaders, not an alternative.**
TanStack Query has built-in Suspense support (`useSuspenseQuery`), as do router loaders.

### 2.4 Zustand for Everything (Replace Bacon.js)

Consolidate all client-side state into Zustand stores, replacing Bacon.js entirely.

**Tradeoffs:**

- (+) Already in the codebase, team knows the patterns
- (+) Simple API, small bundle, excellent TypeScript support
- (+) Selectors for derived state (replaces Bacon.js derived properties)
- (+) `subscribe()` for side effects outside React
- (-) Zustand is for client state — using it for server data cache means reinventing
  what TanStack Query does (staleness, deduplication, background refetch)

### 2.5 Jotai — Atomic State (Alternative to Zustand for Bacon.js Replacement)

Jotai uses an atomic model similar to Bacon.js properties — small independent atoms
with derived atoms computed from them.

**Tradeoffs:**

- (+) Conceptually similar to the existing Bacon.js derived-property model
- (+) Built-in Suspense support (async atoms suspend automatically)
- (+) No store boilerplate, very lightweight
- (+) Fine-grained rerenders (components only update when their specific atoms change)
- (-) Another library to learn (though simple)
- (-) Would coexist with Zustand, adding a third state library
- (-) Less ecosystem tooling than Zustand

### 2.6 Redux Toolkit + RTK Query

Full-stack state management with built-in data fetching.

**Tradeoffs:**

- (+) Single solution for client state + server cache
- (+) RTK Query is comparable to TanStack Query in features
- (-) Significantly more boilerplate than Zustand + TanStack Query
- (-) Heavier bundle, more concepts to learn
- (-) Overkill for this app's complexity

**Verdict: Not recommended for this codebase.** The Zustand + TanStack Query combination
is lighter and achieves the same thing.

---

## 3. Recommended Approach

**TanStack Query + Zustand + optional Suspense boundaries**, migrating away from
Bacon.js and the custom data loading hooks. Router loaders are a potential future
enhancement but not the priority.

### 3.1 Architecture Overview

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
|    useSuspenseQuery                                               |
|         │                                │                        |
|  ┌──────┴────────────────────────────────┴──────────────────┐     |
|  │                    React Components                       │    |
|  │                                                           │    |
|  │  <Suspense fallback={<Skeleton />}>                       │    |
|  │    <MonthView />   ← reads from query cache               │    |
|  │  </Suspense>                                              │    |
|  │                                                           │    |
|  │  Form editors      ← reads from Zustand store             │    |
|  │  Dialog state       ← reads from Zustand store             │    |
|  └───────────────────────────────────────────────────────────┘    |
|                                                                   |
|  Form/Editor State (Zustand) — keep as-is                         |
|  ┌──────────────────────────────────────────────────────────┐     |
|  │ GroupingEditorState, ShortcutEditorState, etc.            │    |
|  └──────────────────────────────────────────────────────────┘     |
+------------------------------------------------------------------+
```

### 3.2 Server Data — TanStack Query

**What it replaces:** `useAsyncData`, `useDeferredData`, `AsyncData` type,
`AsyncDataView` component, `needUpdateBus`.

#### Query Keys

Organize queries by domain with hierarchical keys:

```
['expenses', 'month', '2026-04']
['expenses', 'month', '2026-03']
['categories', 'year', '2026']
['categories', 'month', '2026-04']
['subscriptions', 'list', { criteria }]
['subscriptions', 'detail', 42]
['tracking', 'data', { subjectId, range }]
['search', { query, filters }]
```

Hierarchical keys enable targeted invalidation: invalidating `['expenses']` refetches
all expense queries; invalidating `['expenses', 'month', '2026-04']` refetches only
that month.

#### Reading Data — Queries

Each component that loads server data uses `useQuery` or `useSuspenseQuery`:

```
MonthView          → useQuery(['expenses', 'month', date])
CategoryView       → useQuery(['categories', viewType, period])
SubscriptionsPage  → useQuery(['subscriptions', 'list', criteria])
SubscriptionDetail → useQuery(['subscriptions', 'detail', id])
DbStatusView       → useQuery(['db', 'status'])
```

**With `useQuery`:** the component receives `{ data, isLoading, error }` and handles
each state — similar to the current `AsyncData` pattern but with caching built in.

**With `useSuspenseQuery`:** the component only receives `{ data }` because loading
and error are handled by `<Suspense>` and `<ErrorBoundary>` wrappers. This is cleaner
but requires wrapping components in boundaries.

**Choosing between them:** Start with `useQuery` for a simpler migration (1:1 replacement
of existing hooks). Adopt `useSuspenseQuery` + `<Suspense>` boundaries incrementally in
places where it improves the loading UX (e.g., page-level skeletons).

#### Writing Data — Mutations

When the user creates, updates, or deletes an expense:

```
useMutation({
  mutationFn: (data) => apiConnect.saveExpense(data),
  onSuccess: () => {
    // Invalidate all expense queries — they'll refetch automatically
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
    // Also invalidate category totals since they depend on expenses
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  },
})
```

**This replaces `needUpdateBus` entirely.** Instead of firing a global "something changed"
event and hoping every interested component subscribes, you invalidate specific query
keys and TanStack Query refetches only the affected queries. Components subscribed to
those queries re-render with fresh data automatically.

**Cross-domain invalidation examples:**

| Mutation          | Invalidates                                           |
| ----------------- | ----------------------------------------------------- |
| Save expense      | `['expenses']`, `['categories']`, `['subscriptions']` |
| Delete expense    | `['expenses']`, `['categories']`                      |
| Update category   | `['categories']`, session data                        |
| Save subscription | `['subscriptions']`                                   |
| Save grouping     | `['groupings']`                                       |

#### Optimistic Updates

For operations where the result is predictable (e.g., deleting an expense), the cache
can be updated immediately before the server responds:

```
onMutate: (deletedId) => {
  // Remove from cache instantly — UI updates immediately
  queryClient.setQueryData(['expenses', 'month', date], (old) =>
    old.filter(e => e.id !== deletedId)
  );
},
onError: () => {
  // Roll back on failure
  queryClient.invalidateQueries({ queryKey: ['expenses'] });
},
```

This is optional and can be added incrementally where instant feedback matters most.

#### Stale-While-Revalidate Behavior

When navigating from April to March and back to April:

1. First visit to April: loading spinner → fetch → show data
2. Navigate to March: loading spinner → fetch → show data
3. Navigate back to April: **instantly shows cached April data** while refetching
   in the background. If data changed, it updates silently.

This eliminates the "flash of loading" on every navigation that exists today.

#### Background Refetching

TanStack Query can refetch stale queries when:

- The browser tab regains focus (user switches back to the app)
- The network reconnects
- A configurable stale time elapses

This replaces `useSessionRefreshOnFocus` with a general mechanism.

### 3.3 Client State — Zustand (Replacing Bacon.js)

**What it replaces:** all Bacon.js Buses, Properties, derived properties, and the
`useBaconProperty`/`useBaconState` hooks.

#### Session Store

Replace `sessionBus`/`sessionP`/`validSessionP` and derived properties
(`userMapP`, `sourceMapP`, `categoryMapP`, etc.) with a single Zustand store:

```
useSessionStore
  state:    session, isLoggedIn
  derived:  userMap (selector), sourceMap (selector), categoryMap (selector),
            categoryDataSource (selector), expenseGroupingMap (selector)
  actions:  login, logout, refreshSession, setGroup
```

Derived values currently computed as Bacon.js Properties (`categoryMapP` from
`sessionP`) become Zustand selectors or memoized derived state.

#### Navigation Store

Replace `navigationBus`/`navigationP`:

```
useNavigationStore
  state:    currentDate, viewType (month/year), dateRange
  actions:  navigateTo, setDateRange
```

#### Dialog Store

Replace `expenseDialogBus`, `expenseSplitBus`, `dialogActionBus`:

```
useDialogStore
  state:    activeDialog (type + props + resolve callback)
  actions:  openExpenseDialog, openSplitDialog, openConfirm, openSelect, close
```

The Promise-based dialog resolution pattern (open dialog → await result) can be
preserved by storing the resolve function in the store.

#### Notification Store

Replace `notificationBus`:

```
useNotificationStore
  state:    notifications[]
  actions:  show, dismiss, showSuccess, showError
```

### 3.4 Form/Editor State — Keep As-Is

The existing Zustand stores for editors (`useGroupingState`, `useShortcutState`,
`useTrackingState`, etc.) are well-designed and need no changes. They manage local
form state with validation and async saves — exactly what Zustand is good at.

The save actions in these stores would use TanStack Query mutations instead of direct
API calls, gaining automatic cache invalidation.

### 3.5 Suspense Boundaries — Optional Enhancement

Suspense can be adopted incrementally. It is not required for the migration but
improves the loading UX in specific places.

**Without Suspense (simpler, works everywhere):**

```
function MonthView({ date }) {
  const { data, isLoading, error } = useQuery(...)
  if (isLoading) return <Skeleton />
  if (error) return <ErrorDisplay error={error} />
  return <ExpenseList expenses={data} />
}
```

**With Suspense (cleaner component, loading state handled by parent):**

```
function MonthView({ date }) {
  const { data } = useSuspenseQuery(...)
  return <ExpenseList expenses={data} />
}

// Parent:
<Suspense fallback={<MonthViewSkeleton />}>
  <MonthView date={date} />
</Suspense>
```

**Where Suspense adds the most value:**

- Page-level loading skeletons (show app shell immediately, content loads in)
- Multiple independent data sources on one page (each section loads independently
  with its own Suspense boundary)
- Nested data (show parent data while children are still loading)

**Where Suspense doesn't help much:**

- Simple components with one data source (the `if (isLoading)` pattern is fine)
- Data that loads conditionally or on user interaction

### 3.6 Router Loaders — Future Enhancement

Migrating from `<BrowserRouter>` to `createBrowserRouter` with data loaders is a
potential future step that gives one additional benefit: **data fetching starts on
navigation (click), not on component mount**.

Current flow (component-driven):

```
Click link → navigate → mount MonthView → start fetch → loading → render data
```

With router loaders:

```
Click link → start fetch + navigate → (loading indicator in navbar) → render with data
```

This eliminates the per-page loading state entirely for primary route data. However:

- The migration touches all route definitions
- It requires restructuring how route params flow to data fetching
- It can coexist with TanStack Query (loader pre-fills the query cache, component reads
  from cache) but adds complexity
- The benefit is mostly cosmetic — a few hundred ms faster perceived navigation

**Recommendation:** Do the TanStack Query + Zustand migration first. Add router loaders
later if the navigation feel isn't fast enough with query caching alone.

---

## 4. Migration Plan

### Phase 1: Add TanStack Query Infrastructure ✅

- Install `@tanstack/react-query` and `@tanstack/react-query-devtools`
- Set up `QueryClientProvider` at the app root
- Define query key conventions and a query key factory
- Keep all existing patterns working — this phase adds, doesn't remove

### Phase 2: Migrate Data Loading (Replace useAsyncData/useDeferredData) ✅

Convert components one at a time from `useAsyncData`/`useDeferredData` to `useQuery`:

- Each component's data source function becomes a query function
- `AsyncData` states map to `useQuery`'s `{ data, isLoading, error }` return
- `AsyncDataView` can be replaced with inline conditionals or a thin wrapper
- `loadData()` calls become `refetch()` or query invalidation

Start with leaf components that have simple data dependencies (e.g., `DbStatusView`),
then work up to complex ones (`MonthView`, `CategoryView`).

### Phase 3: Migrate Mutations (Replace needUpdateBus)

Convert all API mutation calls to `useMutation` with `onSuccess` invalidation:

- Expense CRUD → invalidate `['expenses']` and `['categories']`
- Subscription CRUD → invalidate `['subscriptions']`
- Category/source changes → invalidate related queries + session refresh

Once all mutations use `useMutation`, remove `needUpdateBus` entirely.

### Phase 4: Migrate Session State to Zustand (Replace Bacon.js Core)

- Create `useSessionStore` with session state + derived selectors
- Migrate components from `useBaconProperty(sessionP)` to `useSessionStore()`
- Migrate derived properties (`categoryMapP`, `userMapP`, etc.) to selectors
- Remove `Login.ts` and `Categories.ts` Bacon.js code

### Phase 5: Migrate Remaining Bacon.js State

- Navigation state → `useNavigationStore`
- Dialog state → `useDialogStore`
- Notification state → `useNotificationStore`
- Remove `useBaconProperty`, `useBaconState` hooks
- Remove `connectDialog` HOC
- Remove Bacon.js dependency

### Phase 6: Optional Enhancements

- Add `<Suspense>` boundaries for page-level loading skeletons
- Convert `useQuery` to `useSuspenseQuery` in pages that benefit
- Add `<ErrorBoundary>` components for declarative error handling
- Consider router loaders for primary route data if navigation feels slow
- Explore optimistic updates for common operations (delete, toggle, reorder)

### Ordering Rationale

Phases 2-3 (TanStack Query) come before Phases 4-5 (Zustand) because:

1. Data loading is the biggest pain point (no caching, manual invalidation)
2. TanStack Query can coexist with Bacon.js during migration — queries don't care
   where client state lives
3. Removing `needUpdateBus` requires mutations to be migrated first
4. The Zustand migration is more mechanical (state shape doesn't change much) and
   can be done faster once the data layer is settled

### Coexistence During Migration

At any point during the migration, old and new patterns coexist:

- Components using `useAsyncData` and components using `useQuery` can live side by side
- `needUpdateBus` can fire alongside query invalidation (belt and suspenders)
- `useBaconProperty(sessionP)` and `useSessionStore()` can read the same data
  (Zustand store subscribes to session changes and pushes to both systems)

This means the migration can be done incrementally over weeks/months without a
big-bang rewrite, and each phase independently improves the codebase.
