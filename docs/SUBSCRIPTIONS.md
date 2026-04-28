# Subscriptions (Tilaukset) Page

This document describes how the **Tilaukset** page currently works. The page lives at
`/p/tilaukset`; its entry component is `SubscriptionsPage` in
`src/client/ui/subscriptions/SubscriptionsPage.tsx`. The historical design notes for
the rework that produced this implementation are kept in
`docs/archive/SUBSCRIPTIONS_REWORK_PLAN.md`.

## What a subscription is

A **subscription** is a saved `ExpenseQuery` (the _filter_), optionally paired with a
recurrence cadence and a row of `defaults` for auto-generation. The filter defines
which realised `expenses` rows belong to the subscription; everything else the page
shows is derived from those realised rows.

Subscriptions serve a **dual role** under one card:

| Role               | What it does                                                                                                        | Required fields                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **Recurring bill** | Auto-generates one missing `expenses` row per period (e.g. Netflix, rent, insurance).                               | `filter`, `period_unit`+`period_amount`, `defaults`, `next_missing` |
| **Stats grouping** | Groups historical rows into a single ongoing-bill card so they can be averaged and totalled (e.g. fuel, groceries). | `filter` only                                                       |

Both kinds of card answer the same question — **"what does this cost me per month?"** —
by averaging realised `expenses` over a window. The presence or absence of a recurrence
only affects whether the system inserts placeholder rows ahead of time. The card
layout, the per-month / per-year figure, the matched-rows expander, and the totals on
the page are computed identically for the two kinds.

## Why one model for both

Before the rework these lived in two tables (`recurring_expenses` and `reports`) with
two different baseline computations:

- `recurring_expenses` showed a static template sum that aged badly when real bills
  drifted (electricity, water, phone).
- `reports` showed a `sum × 365.25 / daysSinceFirstMatch` projection that silently
  decayed once an expense was converted to recurring (the report query ran with
  `includeRecurring: false`, so the converted rows stopped feeding it).

The unified model uses **realised `expenses` rows as the single source of truth for
the baseline** and adds a deterministic dedup pass so a row counts toward exactly one
subscription. Auto-generation becomes pure automation that doesn't define a number;
the user can convert a manual stats card into a recurring bill without disturbing its
historical baseline.

## Data model

### `subscriptions` table

```
id            INTEGER PK
group_id      INTEGER NOT NULL  → groups(id)
user_id       INTEGER NULL      → users(id)         -- row owner (recurring: defaults.userId; stats: creator)
title         TEXT NOT NULL
filter        JSONB NOT NULL                         -- ExpenseQuery
defaults      JSONB NULL                             -- ExpenseDefaults; required when period_unit is set
period_unit   recurring_period NULL                  -- enum: days|weeks|months|quarters|years
period_amount SMALLINT NULL
next_missing  DATE NULL                              -- next date to auto-generate
occurs_until  DATE NULL                              -- non-NULL ⇒ ended (no future generation)
```

A row with `period_unit IS NULL` is a stats subscription. A row with both
`period_unit` and `period_amount` set is a recurring subscription; if `defaults` is
also non-NULL, generation can produce rows for it.

### `expenses.subscription_id`

Realised rows carry an optional `subscription_id` FK pointing back at
`subscriptions.id`. Its role:

- **Edit/delete propagation** uses the linkage: `target='all'` and `target='after'`
  on a recurring expense `UPDATE` / `DELETE … WHERE subscription_id = $/id/`.
- It is **not** used for dedup or baselines — those run over the filter (see below).
- On hard-delete (`mode=delete`), the FK is nulled so no rows dangle. The
  schema-level constraint stays `NO ACTION`; the app does the null-out before the
  `DELETE FROM subscriptions`.

There is no `template` column on `expenses` and no template-row class — `defaults`
lives on the subscription as typed JSONB, validated by Zod (`ExpenseDefaults` in
`src/shared/expense/Subscription.ts`). The division for an auto-generated row is
derived at generation time from `defaults` plus the source's split, not stored on
the subscription, so the `sum(expense_division.sum) = 0` invariant cannot be broken
by a stale division blob.

### `ExpenseQuery` is the filter shape

The filter is a normal `ExpenseQuery` (`src/shared/expense/Expense.ts`) — the same
shape the search page sends. Categories support a subtree match via
`includeSubCategories`. The query was extended with a `title` field so a filter can
constrain on title alone (e.g. _"all expenses titled 'Sähkölasku'"_) independent of
the wider `search` field, which still matches title OR receiver.

## Filter containment and the dedup pass

Every realised row is assigned to **exactly one** subscription, picked by a
deterministic specificity score. Implementation lives in
`src/shared/expense/SubscriptionMatching.ts` and is unit-tested.

For each `(filter, expense)` pair `scoreFilter` returns either `null` (the filter
rejects the expense) or a non-negative score. The score sums weights for the
constraints the filter actually specifies:

| Match against the expense                                  | Weight |
| ---------------------------------------------------------- | -----: |
| `categoryId` exact (direct hit; main- or sub-cat)          |     20 |
| `categoryId` subtree (via `includeSubCategories`)          |     10 |
| `receiver` (case-insensitive substring)                    |     15 |
| `title` (case-insensitive substring)                       |     15 |
| `search` (case-insensitive substring on title OR receiver) |     10 |
| `type`                                                     |      5 |
| `userId`                                                   |      5 |
| `confirmed`                                                |      2 |
| date range                                                 |      0 |

`pickWinningFilter` chooses the highest-scoring filter for each expense; ties break
on **lowest subscription id** (older subscriptions own disputed rows until the user
narrows one of them). `assignExpensesToSubscriptions` returns the resulting
`Map<subscriptionId, MatchableExpense[]>`.

A subscription whose filter would otherwise have matched rows but that lost all of
them to a more-specific neighbour is reported as **dominated**. The page shows
`Päällekkäinen tilauksen kanssa: <other title>` on the empty card so the user knows
to delete or narrow the redundant row. The dominator is computed in
`SubscriptionService.findDominator` by counting which visible owner steals the most
of this row's would-be matches; ties resolve by lowest owner id.

## Baselines

Implemented in `SubscriptionService.aggregate`. For every subscription:

```
perMonth = sum(matched rows in window) / window.months
perYear  = perMonth * 12
```

The window is the page's range selector (1y / 3y / 5y), defaulting to 5 years on the
backend when the criteria omit it. The same formula runs for both recurring and stats
subscriptions — the only difference is whether the system also inserts auto-generated
rows that then count themselves into the average.

### Window definition

The window is computed in `baselineWindow`
(`src/shared/expense/SubscriptionWindow.ts`) and applied identically by `/search`,
`/matches`, and `/query-summary`:

- **`endDate` = end-of-current-month.** Caps the window so pre-generated future
  expenses (a user who's browsed forward and materialised next month's rent) do not
  inflate `matchedSum` or per-month / per-year averages. End-of-month rather than
  `NOW()` so a subscription whose current-month expense was already booked early in
  the month still counts as one full month's worth.
- **`startDate` = `endDate + 1 day − range`.** Anchored to the end so 1y / 3y / 5y
  span exactly the trailing **12 / 36 / 60 calendar months** (start-of-month to
  end-of-month, inclusive). For example, on any day in April 2026 the 1y window is
  `2025-05-01 .. 2026-04-30`.
- **`months`** is derived from the range directly (`years × 12`, `months` as given),
  not from a date diff, so the per-month denominator is an exact integer regardless
  of month-length variation. Week / day units fall back to a 30-days-per-month
  approximation (the UI exposes only year ranges today).

The candidate-expense SQL constrains `date` between `startDate` and `endDate`
inclusive (`fetchCandidateExpenses` in `SubscriptionService.ts`). Unit tests for the
math live alongside the helper at
`src/shared/expense/SubscriptionWindow.test.ts`; the future-exclusion behaviour is
covered end-to-end in `src/integration/Subscription.test.ts`.

**All realised rows count, confirmed or not.** `confirmed` is the user's "to-verify"
marker, not a gate on aggregation. **Ended subscriptions keep contributing** until
the subscription is hard-deleted: a row that paid rent for 10 of the last 12 months
should still raise the 12-month average, even if the user has stopped generating new
rent rows.

## Card layout: one row, one card; broad filters fan out

`SubscriptionService.buildCardsForRow` produces the per-card payload (`Subscription`
in `src/shared/expense/Subscription.ts`):

- A **recurring** subscription always lives in one category (its filter must name a
  `categoryId`) and produces exactly **one card**.
- A **stats** subscription whose filter spans multiple categories fans out — one
  card per category that its assigned rows actually landed in. The page chart can
  then attribute totals to the right category, instead of dumping everything under
  a single "broad query" entry. Each fan-out card carries the same `rowId` but a
  unique `id` (`subscription-<rowId>-<categoryId>`).
- For fan-out cards exactly one is marked `isPrimary: true` — the natural
  `categoryId` from the filter if it's in the fan-out, otherwise the bucket with
  the largest realised sum (id tiebreaker). Edit / Lopeta / Poista actions render
  only on the primary card so the user can't accidentally delete the whole
  subscription from a per-category breakdown row.
- A stats subscription with no matches but a categorised filter still produces one
  empty card under that category so the user can find and remove it.

## Search service

`SubscriptionService.searchSubscriptions` (`src/server/data/SubscriptionService.ts`)
is the only place the unified result is assembled. The flow per call:

1. Load all `subscriptions` rows for the group (`getSubscriptionRows`).
2. Build `SubscriptionFilter`s — each filter is a normalised view that pre-resolves
   `includeSubCategories` into a `subtreeCategoryIds` set so scoring is hot-path
   cheap.
3. Fetch candidate expenses inside the baseline window (`fetchCandidateExpenses`).
   The dedup pass runs over **all** candidates regardless of the visible-types
   filter — narrowing candidates up front would shift `isPrimary`, `dominatedBy`,
   and the per-month figures depending on which type checkboxes are toggled.
4. Run `assignExpensesToSubscriptions` to get the deduped owner per row.
5. Apply the **display filter** (`includeEnded`, `onlyOwn`, type) to subscription
   rows, and for empty rows compute a dominator pointing only at _visible_
   neighbours (a hidden dominator would be a confusing reference).
6. Emit one or more `Subscription` cards per row via `buildCardsForRow`.

The search endpoint returns a flat `Subscription[]`. Grouping into the
root-category / sub-category tree happens client-side in
`src/client/ui/subscriptions/SubscriptionsData.ts`.

## Generation

Auto-generation is lazy, triggered from the month expense view (`getExpensesByMonth`
in `src/server/data/Expenses.ts`) — same pattern as the pre-rework code. The free-text
search and the subscriptions endpoints intentionally do **not** trigger generation, so
a user who only ever looks at the search page can still see stale `next_missing` for a
subscription until they next open a month view. `createMissingRecurringExpenses`
(`src/server/data/RecurringExpenseDb.ts`) runs at the top of the month query:

```sql
SELECT id, defaults, next_missing, occurs_until, period_amount, period_unit
  FROM subscriptions
  WHERE group_id = $/groupId/
    AND period_unit IS NOT NULL
    AND next_missing < $/nextMissing/::DATE;
```

For each hit, `getDatesUpTo` walks `next_missing` forward by one period at a time
until it reaches the cutoff (the lower of the search end date and `occurs_until`).
Each missing date is materialised through `generateRowFromDefaults`, which inserts
an `expenses` row from `defaults` and computes its division from the source split
via `determineDivision`. After the batch, `next_missing` is advanced past the last
inserted date.

`occurs_until` ends generation but does not hide the row from the catch-up query —
the per-row loop just no-ops because `getDatesUpTo` returns `[]`. The prod DB is
small enough that the cost is trivial; clamping `next_missing = occurs_until + 1
period` on end is the obvious tightening if it ever matters.

## Lifecycle

### Create

Two paths both produce subscription rows:

- **Convert an existing expense to recurring.** `POST /api/expense/recurring/:expenseId`
  → `createRecurringFromExpense` derives `filter = { categoryId [+ receiver] }` and
  `defaults` from the source expense, computes `next_missing` from the period, and
  inserts the `subscriptions` row. The originating expense is linked back via
  `subscription_id`.
- **Save a stats card from a filter.** `POST /api/subscription/from-filter` with
  `{ title, filter }`. No recurrence, no defaults — the user can later widen or
  narrow the filter from the editor dialog.

The editor dialog (`SubscriptionEditorDialog`) supports both creating a new stats
card (no `defaults` tab visible) and editing any existing subscription. The
"Mallikulu" tab edits `defaults` and is shown only for rows with recurrence.

For preview, `POST /api/subscription/query-summary` returns
`{ count, sum, matches }` for an arbitrary `ExpenseQuery` so the dialog can render
"this filter currently matches N expenses worth €X" plus a sample of the most
recent matches. The backend rejects an empty query so a scripted client can't dump
every expense in the group through this endpoint.

### Edit

`PATCH /api/subscription/:subscriptionId` accepts a partial `SubscriptionUpdate`
(`title`, `filter`, `defaults`). Cadence (`period_unit` / `period_amount`) and
`occurs_until` are intentionally not editable — changing the cadence on a row that
already has realised rows has no clean meaning, and `occurs_until` is owned by the
end / `target=after` flows. Defaults references (`categoryId`, `sourceId`,
`userId`) are validated against the session group before writing.

The "edit recurring expense" propagation (`PUT /api/expense/recurring/:expenseId`
with `target = 'single' | 'all' | 'after'`) is preserved from the old design and
operates on the `subscription_id` linkage:

- `'single'` — update one realised row, leave `defaults` and other rows alone.
- `'all'` — update `defaults` and `UPDATE expenses SET … WHERE subscription_id = X`
  (every linked row).
- `'after'` — update `defaults` and `UPDATE expenses SET … WHERE subscription_id = X
  AND (id = $/editedId/ OR date > $/editedDate/::DATE)`. The edited row is included
  by id; same-date siblings are not (replaces the older `date >= afterDate` rule
  which had a same-date ambiguity).

`'all'` and `'after'` also rewrite the affected rows' `expense_division` rows from
the new defaults' division.

> **`'all'` / `'after'` is the only way to retroactively reshape generated rows.**
> The pre-rework template-row class is gone, so editing the subscription's
> `defaults` directly (via `PATCH /api/subscription/:id`) only changes *future*
> generation — it does not touch any existing `expenses` row. To correct a price
> change or a categorisation mistake on rows that have already been auto-generated,
> open one of those rows in the expense editor, fix it, and save with `target='after'`
> (this row + later) or `target='all'` (every linked row). Defaults follow the same
> update so the next auto-generated row inherits the correction.

### End vs. delete

A subscription can be ended (kept around as historical context) or deleted entirely.
`DELETE /api/subscription/:subscriptionId?mode=end|delete` dispatches based on the
row's state (`deleteSubscriptionById`):

- **`mode=end`** — only valid on an ongoing recurring row (`period_unit` set,
  `occurs_until IS NULL`). Sets `occurs_until = today`. History stays, no future
  generation, baseline still ticks down naturally as the rolling window advances.
  This is "Lopeta tilaus" in the UI.
- **`mode=delete`** — valid on already-ended recurring rows or any stats row.
  Nulls `subscription_id` on linked expenses, then `DELETE FROM subscriptions`.
  This is "Poista tilaus" in the UI.

The asserted `mode` must match the server-derived expected mode. A mismatch returns
HTTP 409 with `SUBSCRIPTION_DELETE_MODE_MISMATCH` — guards against UI races where
two rapid clicks would otherwise silently turn "Lopeta" into "Poista".

The `target='all'` / `target='after'` deletes through `DELETE
/api/expense/recurring/:expenseId` are still available and behave as before:
remove the subscription plus the linked expenses (whole history or after the cut).

## API surface

### `/api/subscription` (`src/server/api/SubscriptionApi.ts`)

| Method | Path                      | Purpose                                                  |
| ------ | ------------------------- | -------------------------------------------------------- |
| POST   | `/search`                 | Unified subscription list with deduped baselines.        |
| POST   | `/from-filter`            | Save a stats subscription from `{ title, filter }`.      |
| POST   | `/query-summary`          | Preview `{ count, sum, matches }` for an `ExpenseQuery`. |
| POST   | `/matches`                | Paginated rows currently assigned to a subscription.     |
| PATCH  | `/:subscriptionId`        | Update title / filter / defaults.                        |
| DELETE | `/:subscriptionId?mode=…` | Soft-end (`end`) or hard-delete (`delete`).              |

### `/api/expense/recurring` (`src/server/api/RecurringExpenseApi.ts`)

Operates on **expense ids**, not subscription ids — these are the actions the user
triggers from an expense row.

| Method | Path                  | Purpose                                                                                 |
| ------ | --------------------- | --------------------------------------------------------------------------------------- |
| POST   | `/:expenseId`         | Convert this expense to a recurring subscription.                                       |
| PUT    | `/:expenseId?target=` | Edit propagation (`single` / `all` / `after`).                                          |
| DELETE | `/:expenseId?target=` | Delete propagation (`single` removes only this row; `all` / `after` remove the series). |

There is no separate `/api/report` endpoint — the legacy `reports` table and its
API were removed in the rework migration.

## Frontend

### Route and component tree

- Path: `/p/tilaukset` (`src/client/util/Links.ts`).
- Mounted in `src/client/ui/layout/AppRouter.tsx`.

```
SubscriptionsPage                                 SubscriptionsPage.tsx
├── PageTitle  +  "Uusi tilaus" button            opens SubscriptionEditorDialog (create mode)
├── SubscriptionCriteriaSelector                  type / range / includeEnded / onlyOwn
└── SubscriptionsResults  (in QueryBoundary)
    ├── SubscriptionCategoryHeader                top-level totals card
    ├── TotalsChart                               pie chart + "Kulut per kk" toggle
    └── GroupView  (per root category)
        ├── SubscriptionCategoryHeader            root header with visibility toggle
        └── CategorySubscriptions  (per sub-cat)
            ├── SubscriptionCategoryHeader
            └── SubscriptionItemView  (per card)
                ├── SubscriptionRow               compact card row (kind / title / sums / next)
                ├── ExpandedDetails               expander with SubscriptionMatchesView
                └── SubscriptionEditorDialog      edit mode (only on isPrimary card)
```

### Card kinds in the UI

`SubscriptionItemView.subscriptionKind` derives one of:

- **`active`** — recurrence set, not ended, not stale. Primary colour, "Toistuu N
  kk välein", next-missing date in the right column.
- **`ended`** — `occurs_until` is in the past, _or_ the subscription is stale (a
  recurring row whose `next_missing` slipped into the past with zero matches in the
  window — almost certainly a forgotten "Lopeta"). Muted background, "Päättynyt"
  subtitle.
- **`stats`** — no recurrence at all. Bar-chart icon, "Tilastotilaus" subtitle.

### Filters (localStorage-backed)

| Key                                                    | Purpose                                                   |
| ------------------------------------------------------ | --------------------------------------------------------- |
| `subscriptions.type.expense` / `.income` / `.transfer` | expense-type checkboxes                                   |
| `subscriptions.range`                                  | window for baseline + matched rows (`RecurrenceInterval`) |
| `subscriptions.includeEnded.v2`                        | include ended subscriptions (default: true)               |
| `subscriptions.onlyOwn`                                | only the current user's subscriptions                     |
| `subscriptions.show.months`                            | pie chart per-month vs. per-year                          |
| `subscription.filter.hiddenCategories`                 | collapsed root categories (array)                         |

The bumped `includeEnded.v2` key reflects a default change: ended rows are now
visible so a freshly-ended subscription doesn't disappear (and so dominator
references can never point at an invisible row).

## Shared types

| Type                                                          | File                                         |
| ------------------------------------------------------------- | -------------------------------------------- |
| `Subscription`                                                | `src/shared/expense/Subscription.ts`         |
| `SubscriptionResult`                                          | same                                         |
| `SubscriptionSearchCriteria`                                  | same                                         |
| `SubscriptionUpdate` / `SubscriptionFromFilter`               | same                                         |
| `SubscriptionDeleteMode` / `SubscriptionDeleteQuery`          | same                                         |
| `SubscriptionPreviewRequest` / `QuerySummary`                 | same                                         |
| `SubscriptionMatchesQuery` / `SubscriptionMatches`            | same                                         |
| `ExpenseDefaults`                                             | same                                         |
| `SubscriptionFilter` / `MatchableExpense` / scoring functions | `src/shared/expense/SubscriptionMatching.ts` |
| `RecurrencePeriod`                                            | `src/shared/expense/Recurrence.ts`           |
| `ExpenseQuery` (filter shape, with `title` field)             | `src/shared/expense/Expense.ts`              |

## Notes for future work

- **Specificity weights are tuned by feel.** The ordering they produce is what
  matters; if the dataset grows enough that real conflicts surface, retune
  against the prod data.
- **Generation is lazy and per-search.** Adding a scheduled generator is fine,
  but the laziness is load-bearing for the convert-an-expense flow — the new
  subscription's first auto-row should not appear before the user looks at the
  next month.
- **Stats cards fan out by category.** A filter that matches expenses in three
  categories produces three cards under one row. Edit / delete render only on
  the primary; that's by design but not necessarily obvious.
- **Hardcoded Finnish strings** throughout. The page is single-language.
