# Suspense + Error Boundary Migration Plan

Tracking issue: [thaapasa/bookkeeper#94](https://github.com/thaapasa/bookkeeper/issues/94)

## Goal

Eliminate per-component loading and error state handling by using React Suspense
boundaries with TanStack Query's `useSuspenseQuery`. Components only deal with the
happy path — loading, error, and background refetch indication are handled by
boundary wrappers.

## Current State

Components use `useQuery` and handle loading/error inline:

```tsx
function MonthView({ date }) {
  const { data, isLoading, error } = useQuery(...)
  if (isLoading) return <Skeleton />
  if (error) return <ErrorDisplay error={error} />
  return <ExpenseList expenses={data} />
}
```

Every data-loading component repeats this pattern.

## Target State

```tsx
// Route level
<QueryBoundary fallback={<MonthViewSkeleton />}>
  <MonthView date={date} />
</QueryBoundary>

// Component — happy path only
function MonthView({ date }) {
  const { data } = useSuspenseQuery(...)
  return <ExpenseList expenses={data} />
}
```

## QueryBoundary Component

A reusable wrapper that stacks three concerns:

1. **ErrorBoundary** (outermost) — catches query errors, renders a retry-able error
   display with a "Try again" button that resets the boundary.
2. **Suspense** — shows a caller-provided fallback (skeleton or spinner) on initial
   load when no cached data exists.
3. **Refetch indicator** (optional) — a subtle visual hint during background
   revalidation while stale cached data is displayed.

```tsx
<QueryBoundary
  fallback={<PageSkeleton />}       // Suspense fallback
  errorFallback={<PageError />}      // optional custom error display
>
  <PageContent />
</QueryBoundary>
```

### Error handling

Use `react-error-boundary` or a minimal custom class component. The error fallback
should:

- Show what went wrong (without leaking internals)
- Offer a "Try again" button that calls `resetErrorBoundary()`, which clears the
  error and re-renders children (triggering a fresh query)
- Optionally allow navigating away

### Background refetch indicator

`useSuspenseQuery` returns `isFetching` even when data is cached. Two options:

- **Global**: a thin progress bar at the top of the app (like YouTube/GitHub) driven
  by `useIsFetching()` from TanStack Query. Simple, consistent, one implementation.
- **Per-boundary**: a subtle overlay or spinner within the boundary. More precise but
  more work.

Recommendation: start with a **global** progress bar. It's one component, covers all
queries, and avoids threading `isFetching` through every page.

## Boundary Placement

Boundaries go at the **route level** — one per page. This is the natural loading unit:

- `/kuukausi` → MonthView boundary
- `/kategoriat` → CategoryView boundary
- `/haku` → SearchPage boundary
- `/tilaukset` → SubscriptionsPage boundary
- `/seuranta` → TrackingPage boundary
- `/profiili` → ProfileView boundary

If a page has **independent sections** that can load separately, nest a second boundary
around just that section. Don't over-split — most pages load a single query.

## Migration Steps

### Step 1: Infrastructure

- Add `react-error-boundary` (or write a minimal one)
- Create `QueryBoundary` component in `client/ui/component/`
- Create a generic `QueryErrorDisplay` component
- Add a global `IsFetchingBar` component to the app shell

### Step 2: Migrate pages one at a time

For each page:

1. Create a skeleton fallback component (or use a generic one initially)
2. Wrap the page component in `<QueryBoundary>` at the route level
3. Switch from `useQuery` to `useSuspenseQuery` inside the component
4. Remove inline `isLoading`/`error` handling
5. Verify: initial load shows skeleton, cached navigation is instant, errors
   show the error display with retry

Start with a simple page (e.g. SubscriptionsPage) and work toward complex ones
(MonthView, CategoryView).

### Step 3: Refine

- Add page-specific skeleton components where generic ones look bad
- Consider per-section boundaries for pages with multiple independent queries
- Tune `staleTime` per query if some data should suspend less often

## Stale-While-Revalidate Behavior

With `useSuspenseQuery`:

- **First visit** (empty cache): Suspense fires, skeleton shows, data loads, renders
- **Return visit** (cached data): renders immediately with cached data, background
  refetch updates silently, global progress bar hints at activity
- **Cache expired + revisit**: same as return visit if `gcTime` hasn't elapsed;
  same as first visit if cache was garbage collected

The default `staleTime: 0` means data is always "stale" so background refetch happens
on every mount. Cached data still shows instantly — "stale" just means "will refetch
in background". Suspense only fires when there's truly nothing to show.
