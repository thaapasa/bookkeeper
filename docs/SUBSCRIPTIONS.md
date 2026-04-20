# Subscriptions (Tilaukset) Page

This document describes how the **Tilaukset** page currently works, so future changes
have a clear picture of the existing behaviour. The page lives at `/p/tilaukset` and
its entry component is `SubscriptionsPage` in
`src/client/ui/subscriptions/SubscriptionsPage.tsx`.

## TL;DR

The page unifies **two conceptually different tracking mechanisms** under one UI, both
called "subscriptions" for the user:

| #   | Type                  | What it is                                                                                                                    | Source of truth            |
| --- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| 1   | **Recurring expense** | An explicit recurring transaction with a period and a template expense (e.g. Netflix, rent, insurance).                       | `recurring_expenses` table |
| 2   | **Expense report**    | A saved filter query whose historical matches are extrapolated into a per-month / per-year figure (e.g. "all fuel expenses"). | `reports` table            |

Both are returned together from the same search endpoint, grouped by category, and
rendered in the same list with a pie chart on top.

## Two subscription types

### 1. Recurring expense (`type: 'recurring'`)

- Stored in the `recurring_expenses` table. Each row points at a **template expense**
  (an `expenses` row with `template = true`) via `template_expense_id`.
- Every realised occurrence is a normal row in `expenses` whose `recurring_expense_id`
  column points back at the recurring expense. This is an explicit 1-to-many link — the
  app is responsible for generating missing occurrences (tracked by `next_missing`).
- Recurrence rule is stored as two columns, `period_unit` (`days | weeks | months |
years | quarters`) and `period_amount`, and rebuilt into a `RecurrencePeriod`
  `{ amount, unit }` when read.
- `occurs_until` is `NULL` for active subscriptions; a non-null value means the
  subscription has ended on that date.
- `recurrencePerMonth` / `recurrencePerYear` are computed from the period + sum, not
  from realised expenses.
- Full CRUD: the UI lets the user view details, edit the template expense, and delete
  the subscription (leaving realised expenses in place).
- Shared schema: `RecurringExpense` in `src/shared/expense/RecurringExpense.ts`.

### 2. Expense report (`type: 'report'`)

- Stored in the `reports` table: `{ id, group_id, user_id, title, query }` where
  `query` is a JSONB serialised `ExpenseQuery` (category, search text, date range, etc).
- No data is precomputed. On every search, the stored query is re-executed against the
  `expenses` table and the matching rows are aggregated by category.
- The aggregation excludes actual recurring-expense instances (`includeRecurring:
false` in `src/server/data/ReportDb.ts:87`) so the two types do not double-count.
- The per-year figure is extrapolated from history:
  `perYear = sum * 365.25 / daysSinceFirstMatch`, and `perMonth = perYear / 12`
  (`ReportDb.ts:112`).
- A single `reports` row can produce **multiple** items — one per category that the
  query matched. Their synthetic IDs are `report-<reportId>-<categoryId>`
  (`ReportDb.ts:119`).
- UI only exposes **delete**. The `POST /api/report` create endpoint exists but is not
  wired into this page, and there is no update endpoint at all.
- Shared schema: `ExpenseReport` and `ReportDef` in `src/shared/expense/Report.ts`.

### How the two types are discriminated

The shared union lives at `src/client/ui/subscriptions/types.ts:16`:

```ts
export type SubscriptionItem = RecurringExpense | ExpenseReport;
```

Discrimination is done on the literal `type` field:

```ts
// src/client/ui/subscriptions/SubscriptionItemView.tsx:22
item.type === 'recurring' ? <RecurringExpenseItem item={item} /> : <ReportItem item={item} />
```

## Frontend

### Route

- Path: `/p/tilaukset` (`src/client/util/Links.ts:6`).
- Mounted in `src/client/ui/layout/AppRouter.tsx:51`.

### Component tree

```
SubscriptionsPage                                 SubscriptionsPage.tsx
├── PageTitle "Tilaukset"
├── SubscriptionCriteriaSelector                  filters (type, range, ended, onlyOwn)
└── SubscriptionsResults (rendered once criteria exists)
    ├── SubscriptionCategoryHeader                top-level totals card
    ├── TotalsChart                               pie chart + "Kulut per kk" toggle
    └── GroupView  (per root category)
        ├── SubscriptionCategoryHeader            root header with visibility toggle
        └── CategorySubscriptions (per sub-category)
            ├── SubscriptionCategoryHeader        sub-category header
            └── SubscriptionItemView (per item)
                ├── RecurringExpenseItem          expandable → SubscriptionDetails
                └── ReportItem                    delete only
```

### Data fetch

`SubscriptionsResults` uses `useSuspenseQuery` with
`apiConnect.searchSubscriptions(criteria)` and transforms the result with
`groupSubscriptions(result, categories)` from
`src/client/ui/subscriptions/SubscriptionsData.ts`. Grouping merges recurring
expenses and reports by **root category**, then by sub-category, summing
`recurrencePerMonth` / `recurrencePerYear` at each level.

### Filters (localStorage-backed)

| Key                                                    | Purpose                           |
| ------------------------------------------------------ | --------------------------------- |
| `subscriptions.type.expense` / `.income` / `.transfer` | expense-type checkboxes           |
| `subscriptions.range`                                  | date range (`RecurrenceInterval`) |
| `subscriptions.includeEnded`                           | include ended subscriptions       |
| `subscriptions.onlyOwn`                                | only the current user's data      |
| `subscriptions.show.months`                            | pie chart per-month vs. per-year  |
| `subscription.filter.hiddenCategories`                 | collapsed root categories (array) |

## Backend

### Subscription API (`src/server/api/SubscriptionApi.ts`)

| Method | Path                                             | Handler                                                                                      |
| ------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| POST   | `/api/subscription/search`                       | `SubscriptionService.searchSubscriptions`                                                    |
| GET    | `/api/subscription/:recurringExpenseId`          | `getRecurringExpenseDetails`                                                                 |
| GET    | `/api/subscription/:recurringExpenseId/template` | `getRecurringExpenseTemplate`                                                                |
| PUT    | `/api/subscription/template/:expenseId`          | `updateRecurringExpenseTemplate` (note: takes template expense id, not recurring expense id) |
| DELETE | `/api/subscription/:recurringExpenseId`          | `deleteRecurringExpenseById`                                                                 |

### Report API (`src/server/api/ReportApi.ts`)

| Method | Path                    | Handler         |
| ------ | ----------------------- | --------------- |
| POST   | `/api/report`           | `createReport`  |
| POST   | `/api/report/all`       | `getAllReports` |
| DELETE | `/api/report/:reportId` | `deleteReport`  |

### Search service

`src/server/data/SubscriptionService.ts` is the only place the two worlds are joined:

```ts
const recurringExpenses = await searchRecurringExpenses(tx, groupId, userId, criteria);
const reports = await searchReports(tx, groupId, userId, criteria);
return { recurringExpenses, reports };
```

`searchRecurringExpenses` (in `RecurringExpenseDb.ts`) joins `recurring_expenses`
against the template `expenses` row, filters by `group_id`, respects `includeEnded`
via `occurs_until IS NULL OR occurs_until >= NOW()`, and optionally filters by type
and by `userId` (`onlyOwn`). It computes `recurrencePerMonth` / `recurrencePerYear`
from the period and the template sum.

`searchReports` (in `ReportDb.ts`) fetches every `reports` row for the group, and for
each one re-runs its stored query through `getExpenseSearchQuery` with
`includeRecurring: false` and the criteria's date range (default: last 5 years). It
groups the hits by `categoryId` and emits one `ExpenseReport` per category.

## Shared types

| Type                               | File                                     |
| ---------------------------------- | ---------------------------------------- |
| `RecurringExpense`                 | `src/shared/expense/RecurringExpense.ts` |
| `RecurringExpenseDetails`          | `src/shared/expense/RecurringExpense.ts` |
| `ExpenseReport`                    | `src/shared/expense/Report.ts`           |
| `ReportDef` / `ReportCreationData` | `src/shared/expense/Report.ts`           |
| `SubscriptionSearchCriteria`       | `src/shared/expense/Subscription.ts`     |
| `SubscriptionResult`               | `src/shared/expense/Subscription.ts`     |
| `RecurrencePeriod`                 | `src/shared/expense/Recurrence.ts`       |

## Database

### `recurring_expenses`

```
id                   SERIAL PK
template_expense_id  → expenses(id)
group_id             → groups(id)
period_unit          ENUM(days, weeks, months, years, quarters)
period_amount        SMALLINT DEFAULT 1
occurs_until         DATE NULL       -- NULL ⇒ active
next_missing         DATE NULL       -- next occurrence to generate
```

`expenses.recurring_expense_id` points back at this table, and
`expenses.template = true` marks the template row that drives the recurrence.

### `reports`

```
id        INT PK
group_id  INT
user_id   INT
title     TEXT NOT NULL
query     JSONB NOT NULL   -- serialised ExpenseQuery
```

## Known quirks / likely improvement targets

- **Reports are create-less and edit-less in this page.** `POST /api/report` exists
  but nothing calls it here; there is no update endpoint at all. Users can only delete
  existing reports.
- **PUT endpoint asymmetry.** The update endpoint takes the _template expense id_ in
  the URL, not the recurring-expense id (all other subscription endpoints use the
  recurring-expense id). Easy to trip over.
- **Type filter applies asymmetrically.** The criteria's `type` filter is forwarded
  into both the recurring-expenses query and the report's re-executed `ExpenseQuery`,
  but reports were designed around a stored query — the semantics of overriding one
  field of it at search time are subtle.
- **Reports always re-execute their full query** on every page load, once per report.
  With only a handful of reports this is fine (the prod DB is tiny), but it is O(reports)
  DB round-trips with no caching.
- **Ended-state wording.** `SubscriptionDetails` treats any non-null `occursUntil` as
  "ended", even if the date is in the future.
- **Synthetic report IDs.** `id: "report-<reportId>-<categoryId>"` only exists on the
  client side, and any action on a report item has to parse or carry `reportId`
  separately (see the delete flow in `SubscriptionItemView.tsx:108`).
- **No scheduled generator visible from this flow.** `next_missing` is advanced when
  the app generates the next occurrence, but the trigger for that generation is
  outside the subscriptions page and worth re-checking before changing semantics.
- **Hardcoded Finnish strings** throughout (e.g. `"Tilaukset"`, `"Toteutuma:"`,
  `"Pääkategorian kirjaukset"`, `"Kulut per kk"`).
