# Subscriptions Rework — Design Notes

**Status**: exploratory, not yet decided. See `docs/SUBSCRIPTIONS.md` for the current
implementation. Tracking issue:
[#98](https://github.com/thaapasa/bookkeeper/issues/98).

## Intent of the Tilaukset page

Give the user an honest answer to: "what are my ongoing monthly bills, and what is my
baseline cost of living?" — split by category, aggregating both manually-tracked
patterns and explicitly-recurring obligations.

## Why the current design doesn't deliver that

1. **Baselines come from a static template sum.** Many real recurring bills vary
   month to month (electricity, water, phone). The `recurrencePerMonth` stored on the
   template is an estimate that ages badly.
2. **Reports and recurring expenses can cover the same real-world cost without
   agreeing on a number.** Once an expense is converted from manual → recurring, its
   new rows get `recurring_expense_id` set and the report — which always runs with
   `includeRecurring: false` — stops seeing them.
3. **That dedup rule silently decays the report.** The report's projection
   (`sum * 365.25 / daysSinceFirstMatch`) has a growing denominator but a frozen
   numerator after conversion, so it drifts toward zero over time.
4. **Two data models for one user concept.** From the user's point of view, "my
   fuel costs" and "my Netflix bill" are the same type of thing — recurring expenses
   and expense reports diverge only because of how they were entered.

## Guiding principle for the rework

**Realised `expenses` rows are the single source of truth for the baseline.** The
recurring-expense template is _automation only_ (generate a placeholder row each
period so nothing is forgotten); it does not define a number.

Every subscription's displayed per-month / per-year figure is a rolling aggregate
over the last N months of actually-realised rows.

## Proposed direction — "filter containment"

Chosen over the simpler "manual query wins its category" rule because category is
too coarse (a `receiver=Shell` query should not block an unrelated lease bill in the
same fuel category) and because we still want auto-generation for naturally-recurring
bills even when their category is also covered by a report.

### Shape

- A **subscription** is:
  `{ title, filter: ExpenseQuery, recurrence?, defaults?, nextMissing? }`.
  - `filter: ExpenseQuery` defines _what rows belong to this subscription_.
  - `recurrence?: RecurrencePeriod` — if present, the app auto-generates missing rows
    on the given cadence.
  - `defaults?: ExpenseDefaults` — the "recipe" used when auto-generating a row (see
    "Template data" below). Only meaningful when `recurrence` is set.
  - `nextMissing?: ISODate` — the next date an auto-generated row is expected for.
    Only meaningful when `recurrence` is set; drives the generation trigger (see
    below).
- Every existing `RecurringExpense` migrates to a subscription with an auto-derived
  filter (reasonable default: `category + receiver`), `defaults` copied from the
  template `expenses` row, and `recurrence` + `nextMissing` copied straight from
  `recurring_expenses`.
- Every existing `ReportDef` migrates to a subscription with `recurrence`,
  `defaults`, and `nextMissing` all undefined.

### Template data lives on the subscription (not in `expenses`)

Today, a recurring expense's "recipe" is a ghost row in `expenses` with `template =
true`, pointed at by `recurring_expenses.template_expense_id`. Filtering these ghost
rows out is a real wart: every expense query has to carry `AND template=false`, and
the column is referenced across `ExpenseSearch`, `Expenses`, `BasicExpenseDb`,
`CategoryDb`, `GroupingDb`, `StatisticsDb`, and the update/delete propagation inside
`RecurringExpenseDb`. `BasicExpenseDb.ts:278` also writes the column on insert.

Under this rework the template data moves onto the subscription as a `defaults`
JSONB column, **typed as a Zod schema** (`ExpenseDefaults`, living in
`src/shared/expense/Subscription.ts`) so that invalid shapes are caught at write
time instead of surfacing as runtime errors during generation. `sum` is used
as-is for generated rows — static for stable bills; for variable bills the user
sets an average and relies on `confirmed=false` to prompt a manual correction
each period. Shape:

```ts
export const ExpenseDefaults = z.object({
  title: z.string(),
  receiver: z.string().optional(),
  sum: MoneyLike,
  type: ExpenseType,
  sourceId: ObjectId,
  categoryId: ObjectId,
  userId: ObjectId,
  confirmed: z.boolean(),
  description: z.string().or(z.null()),
  division: ExpenseDivision.optional(),
});
```

`sum` and each `division[i].sum` are stored as decimal strings (same `MoneyLike`
shape the DB already uses for `expenses.sum`), not as JSON numbers, to avoid
float precision loss in JSONB. Note `division` is multi-row: today's template row
has N associated rows in the separate `expense_division` table (keyed by
`expense_id`), and they all have to be aggregated into the subscription's
`defaults.division` during migration. When a brand-new subscription is created
without an explicit division, `defaults.division` can be left undefined and
`determineDivision(defaults, source)` fills it in at generation time (mirroring
today's `createMissingRecurrenceForDate` via `getExpenseAndDivisionData`). Audit
the full `Expense` schema in `src/shared/expense/Expense.ts` at migration time
to make sure no per-expense metadata is missed.

The `template=true` concept goes away, and the `AND template=false` clause
disappears from every site listed above. Both linkage FKs exist today:
`recurring_expenses.template_expense_id` (recurrence → template `expenses` row)
and `expenses.recurring_expense_id` (realised row → recurrence). Under the rework,
the template-side FK goes away entirely; the inverse linkage stays but is renamed
to `subscription_id` (see "Linkage" below). Its role also shifts: today it's a
"generator tag" that the report dedup uses (`includeRecurring: false` excludes
tagged rows); under the rework it's no longer used for dedup and becomes
load-bearing only for edit/delete propagation.

### Generation trigger: `nextMissing`

Auto-generation is lazy, triggered from expense search — same pattern as today's
`createMissingRecurringExpenses` (`src/server/data/RecurringExpenseDb.ts:296`,
called from `Expenses.ts:76`). When expenses are queried up to some end date, the
server first catches up any subscriptions whose `next_missing < endDate`:

```sql
SELECT id, period_unit, period_amount, defaults, next_missing, occurs_until
  FROM subscriptions
  WHERE group_id = $/groupId/
    AND period_unit IS NOT NULL
    AND next_missing < $/endDate/::DATE;
```

(Recurrence lives on the row as today's two columns `period_unit` + `period_amount`
— schema lines 344/347; at the code level they're assembled into a single
`recurrence: RecurrencePeriod` field when read, matching today's `mapRecurringExpense`
at `RecurringExpenseDb.ts:145`.)

1. For each hit, generate missing `expenses` rows from `next_missing` forward by
   one period at a time until `next_missing >= endDate` (or `next_missing >
   occurs_until`, whichever comes first).
2. Write the advanced `next_missing` back.

The `next_missing < endDate` predicate is what makes the catch-up cheap — in the
common case no subscriptions match and no work is done. Keeping this column
hot-path-indexed is part of the contract; it is not an implementation detail we
can elide.

**Ended marker is `occurs_until`, not a null `next_missing`.** A subscription
ended by the user keeps its historical `next_missing` value (for provenance) and
gains an `occurs_until` date. The catch-up loop skips subscriptions whose
`next_missing > occurs_until` naturally, without needing to nullify the column.
Reusing `next_missing` as the ended marker would conflate "done generating" with
"never generated anything" and lose information.

An ended subscription with `next_missing < occurs_until < endDate` still matches
the WHERE predicate and gets loaded by every subsequent search, then the per-row
loop no-ops because `getDatesUpTo` returns an empty list (same as today at
`RecurringExpenseDb.ts:258`). Accepted: the prod DB is small, the per-row cost is
trivial, and tightening this to a single cheap predicate adds complexity for no
measurable gain. If it ever matters, clamp `next_missing = occurs_until + 1 period`
on "end".

### Linkage: `subscription_id` on `expenses`

Today's `expenses.recurring_expense_id` is renamed to `subscription_id` and keeps
the same meaning: "this row was auto-generated by (or is associated with) this
subscription". It is **not** load-bearing for dedup or for baselines — the filter
handles those. It **is** load-bearing for edit/delete propagation (see "Lifecycle"
below), which operates on the linkage, not on the filter.

### Dedup via filter containment

- Drop `includeRecurring: false` from report queries. Everything sees everything.
- Each realised row contributes to **exactly one** subscription: the most specific
  filter that matches it.
- Category rollups are the union of contributing rows, so no double counting even if
  two subscriptions nominally overlap.

### Specificity score (deterministic)

No user-visible ranking step. For a given realised expense, collect the
subscriptions whose filter matches it, score each match, and assign the expense to
the highest-scoring subscription.

The score is per-expense-per-matching-filter — not a static property of the filter
— because category matching in particular depends on _how_ the expense's own
category relates to the filter's `categoryId`. The score is the sum of weights
below, counting only constraints the filter specifies:

| Filter match against the expense                                                             | Weight | Rationale                                       |
| -------------------------------------------------------------------------------------------- | -----: | ----------------------------------------------- |
| Expense's category exactly equals the filter's `categoryId` category                         |     20 | Direct hit (applies to main- and sub-cats)      |
| Expense's category is a descendant of the filter's `categoryId` (via `includeSubCategories`) |     10 | Subtree hit, broader                            |
| `receiver` (ILIKE)                                                                           |     15 | Strong signal, usually unique per merchant      |
| `title` (ILIKE, new field — see below)                                                       |     15 | Same                                            |
| `search` (ILIKE on title OR receiver)                                                        |     10 | Weaker than a title-only or receiver-only match |
| `type`                                                                                       |      5 | Very broad (expense / income / transfer)        |
| `userId`                                                                                     |      5 |                                                 |
| `confirmed`                                                                                  |      2 |                                                 |
| date range                                                                                   |      0 | Time-bounds the filter, not its specificity     |

Subcategory beats parent category by construction: the subcategory filter has
weight 20, while the parent-with-subcats filter has weight 10. A filter with
`{ category + receiver + title }` (50) beats a bare category filter (20).

**Tiebreaker**: when scores are equal, the subscription with the **lowest
subscription id** wins (i.e., created first — older subscriptions "own" the
disputed rows until the user narrows one of them). This keeps the assignment stable
across page loads. During rollout steps 3-5, filters live in two tables
(`recurring_expenses` and `reports`) with independent id sequences; tiebreak first
by source (recurring before report) and then by id within source. Once step 6b
merges the tables, the rule collapses to a single id ordering.

Exact weights are a starting point; tune against the prod dataset during step 3 of
the rollout. The property we need is the ordering, not the specific numbers.

### Extending `ExpenseQuery` with a `title` field

Today `ExpenseQuery.search` does ILIKE across title OR receiver combined. To let a
filter constrain on **title only** (a useful specificity dimension, e.g., "all
expenses whose title contains _electricity_"), add a `title: z.string()` field to
`ExpenseQuery` in `src/shared/expense/Expense.ts:143`, matched as a separate ILIKE
clause in `ExpenseSearch.ts`. `ExpenseQuery`'s `.partial()` wrapper makes the new
field optional automatically; no `.optional()` needed at the field level. The
existing `search` field stays for backward compatibility.

### Baseline computation

- For every subscription: `baselinePerMonth = sum(matching rows in last N months) / N`.
- Same formula for both types. The presence or absence of `recurrence` does not
  change the number — it only affects whether the system inserts placeholder rows.
- N is a UI setting (today's 1 / 3 / 5 year filter repurposed; probably default 12
  months for baselines even when the display range is longer).
- **All realised rows count**, confirmed or not. The `confirmed` flag is a
  user-facing "to-verify" marker, not a gate on aggregation. Most bills are static
  enough that they don't need to be generated unconfirmed; only the subscriptions
  whose real sum varies each period need the manual-check flag.
- **Ended subscriptions keep contributing** to their baseline until the subscription
  is deleted. An ended subscription is still a real historical signal: if you paid
  rent for 10 of the last 12 months, the 12-month average should reflect that.

### UI implications

- Existing card-per-item layout stays, but both card types show the same "baseline
  from last N months" figure plus an optional "next expected" (for subscriptions
  with a recurrence attached).
- Recurring-only actions (edit defaults, toggle auto-generation, see next-missing)
  attach to the subscription when `recurrence` is set.
- Reports gain create/edit in the UI (currently POST /api/report exists but is not
  wired in, and there is no update endpoint).
- **Matched-rows expander** on every subscription card. First level of the
  expander shows the same summary today's `SubscriptionDetails` shows (count,
  first/last date, total sum, next-missing date). A second-level drill-down
  reveals the actual `expenses` rows currently assigned to this subscription,
  clamped to the last ~20 rows with a link that opens the existing expense
  listing page (`/p/kulut/...`) with the subscription's filter prefilled —
  important because a broad filter (whole category) can match hundreds of rows
  and we don't want to inline-render all of them. The drill-down lets the user
  verify that the filter is catching what they expect; no per-row ownership UI
  is exposed, because the specificity rules are deterministic.

## Lifecycle

_SQL in this section uses the post-rename `subscription_id` / `subscriptions`
names. Before rollout step 5 (rename), substitute `recurring_expense_id` /
`recurring_expenses`._

### Create

Creating a subscription with `recurrence` set is the successor to today's "create
recurring expense" flow. Creating one without `recurrence` is the successor to
"save a report". Both go through the same dialog.

- **Filter is auto-derived from the form fields**: default to `category + receiver`
  from whatever the user typed, editable in an "advanced" expander. Two common paths:
  - _From scratch._ Filter defaults to `category + receiver`. If no prior history
    matches, the baseline starts at zero (or at the `defaults.sum` estimate) and
    converges as real rows arrive.
  - _Convert existing manual expense to recurring._ Same — auto-derived filter
    immediately picks up the existing history, so the baseline is meaningful on
    day one. This is the case where not depending on `subscription_id` for the
    baseline pays off.
- **Filter preview in the dialog**: "this filter currently matches N expenses worth
  €X over the last 12 months", so the user notices if the filter is too wide (e.g.
  empty receiver swallowing a whole category).
- **Baselines run over filter matches; edit/delete propagation runs over
  linkage.** Historical rows matched by the filter but not linked (because they
  predate the subscription, or the user created the subscription without
  backfilling `subscription_id` onto matching rows) **are counted in baselines
  but are NOT touched by `'all'` / `'after'` edits**. This is intentional — the
  linkage is the "I created or adopted this row" signal — but users should be
  aware of the divergence.

### Edit propagation (`single | all | after`)

These targets come from today's `RecurringExpenseTarget` and are the reason the
`subscription_id` linkage has to stay. Each target behaves as follows:

- `'single'` — update just the one realised `expenses` row. Subscription `defaults`
  untouched. Other realised rows untouched.
- `'all'` — update subscription `defaults` **and** `UPDATE expenses SET ... WHERE
subscription_id = X`. Every historical and future auto-generated row reflects
  the change.
- `'after'` — update subscription `defaults` **and** `UPDATE expenses SET ...
  WHERE subscription_id = X AND (id = $/editedId/ OR date > $/editedDate/::DATE)`.
  The edited row is included by id; rows strictly after its date are included by
  date. This aligns edit with the more precise predicate `deleteRecurrenceAfter`
  already uses (`RecurringExpenseDb.ts:346`). Today's edit propagation
  (`RecurringExpenseDb.ts:478`) uses `date >= afterDate` instead, which has a
  same-date ambiguity this change eliminates. Rows before the edit point keep
  their old values; future generation uses the new defaults.

"Edit defaults only" (today's `updateRecurringExpenseTemplate`) is an additional
flavour: update subscription `defaults` without touching any realised rows. UX must
be clear this changes _future_ generation only.

### Delete

Today's delete is a single operation with a `RecurringExpenseTarget` (`single |
all | after`). It removes the recurrence and optionally its realised rows. The
rework splits the concerns:

- **End the recurrence** — set `occurs_until` to today (same as today's end-date
  semantics on `recurring_expenses.occurs_until`). `recurrence` stays, so the
  subscription remembers its cadence for historical context, but the generation
  loop skips it because `next_missing > occurs_until`. Subscription stays as a
  pure report-style entry; historical rows keep contributing to its baseline.
  This is "stop generating new rows but keep tracking the bill".
- **Delete the subscription** — remove the subscription row entirely. This is a
  **new semantic**: today's `deleteRecurringExpenseById` (`RecurringExpenseDb.ts:381`)
  doesn't actually delete anything — it sets `occurs_until=today`. The rework
  distinguishes "end" (keep the row) from "delete" (remove the row). Realised rows
  stay in `expenses`; their `subscription_id` is nulled so there is no dangling FK.
  Implementation: `UPDATE expenses SET subscription_id = NULL WHERE subscription_id = X`
  before the `DELETE FROM subscriptions WHERE id = X`. Alternatively we could flip
  the FK `expenses_recurring_expense_id_fkey` (schema line 952, currently NO ACTION)
  to `ON DELETE SET NULL` — pick one during implementation; the app-level null is
  simpler and doesn't need a DDL change.
- **Delete subscription + rows** — the `all` / `after` variants: same split, but
  also `DELETE FROM expenses WHERE subscription_id = X [AND date >= thisDate]`.
  Useful when the user wants to undo an auto-generated series.

Rows matched only by a deleted subscription's filter simply stop being aggregated
anywhere — no manual intervention needed thanks to filter containment.

## Open questions

_(None at the moment — see resolved list below. New ones will land here as the
implementation starts.)_

## Resolved questions

- **Specificity ordering** — deterministic scoring rule, no hand-picking. See
  "Specificity score" section above.
- **Migration default filter** — `category + receiver` is acceptable as the
  auto-derived default; no per-subscription user confirmation required. The filter
  editor must support adding the expense **title** as a constraint, which requires
  adding a `title` field to `ExpenseQuery` (see above).
- **Placeholder rows vs. real rows** — all realised rows count toward baselines
  regardless of `confirmed`. `confirmed` is a user-facing to-verify marker and its
  default value is part of each subscription's `defaults`.
- **How does a user inspect dedup?** — no per-row ownership UI. Each subscription
  card gets a "matched rows" expander listing the rows currently contributing to
  its baseline, which is enough for the user to sanity-check the filter.
- **Ended subscriptions** — they keep contributing to historical baselines until
  the subscription is deleted.
- **`subscription_id` on orphaned rows** — null it out when the subscription is
  deleted. No dangling FKs.
- **Defaults schema** — typed JSONB with a Zod `ExpenseDefaults` schema
  validating shape on write.
- **Auto-generated amount** — use `defaults.sum` as-is, same as today. Rolling
  averages were rejected because they would make every price change ripple into
  the following periods unpredictably: if Netflix goes from €12.99 to €14.99, the
  user edits the first €14.99 realised row with target `after`, which also
  updates `defaults.sum` to €14.99, and future generation picks up the new
  value. Clean, already-familiar flow — no need for a different mechanism for the
  auto-generated sum. For variable bills (electricity etc.), the pattern is
  `defaults.sum = average`, `defaults.confirmed = false`; each period the user
  corrects the generated row to the real amount and sets `confirmed=true`
  (no propagation). The rolling-average option was tempting but would destabilise
  this well-behaved flow.

## What stays the same

- `expenses` table keeps its columns for realised rows. Changes:
  `recurring_expense_id` renames to `subscription_id`, and the `template=true` row
  class (plus the column) goes away.
- Category hierarchy and grouping on the page.
- Pie chart + per-month toggle.
- The `/p/tilaukset` route and the page-level layout.
- Edit/delete propagation with `single` / `all` / `after` targets.

## Rough rollout shape (to flesh out later)

1. Add `filter: JSONB` (shape: `ExpenseQuery`) and `defaults: JSONB` (shape:
   `ExpenseDefaults`) columns to `recurring_expenses`. Backfill `filter` from
   `category + receiver` of the template expense (omit `receiver` if the template's
   receiver is empty; always include `categoryId`). Backfill `defaults` from the
   template row's fields (title, receiver, sum, type, sourceId, categoryId, userId,
   confirmed, description) joined with its aggregated `expense_division` rows on
   `expense_division.expense_id = recurring_expenses.template_expense_id` to build
   the division array.
2. Change the baseline computation for recurring expenses to use realised rows, keep
   reports as-is for now. Validates the "averaging" thesis against real data before
   any dedup changes. _Intermediate state after this step_: recurring cards show
   realised-row baselines; report cards still show the historical projection with
   `includeRecurring: false`. Totals on the page can diverge from the eventual
   steady state — expected during the staged rollout.
3. Remove `includeRecurring: false` from report queries; add the containment dedup;
   switch report baselines to the same realised-row averaging as step 2 (otherwise
   reports keep the old projection while their input set just expanded, which
   double-counts). The specificity-scoring pass reads filters from both
   `recurring_expenses.filter` and `reports.query` (they are both `ExpenseQuery`
   shapes, so the algorithm treats them uniformly without any table merge; tiebreak
   rule is given under "Specificity score"). Compare totals before/after on the
   prod dataset.
4. Unify the two types in the UI and the API. Add `POST /api/subscription/
   query-summary` (returns `{ count, sum }` for an arbitrary `ExpenseQuery`,
   powering the create-dialog filter preview) and an endpoint that returns the
   paginated matched rows for a given subscription (powering the matched-rows
   drill-down). Change `POST /api/subscription/search` to return a single
   `Subscription[]` array; the old `{ recurringExpenses, reports }` shape goes
   away. The legacy `ReportApi` endpoints stay until step 6b below, but the UI
   stops calling them.
5. Drop the template `expenses` rows and the `template` column; switch
   auto-generation to read from `defaults`. Remove `AND template=false` from every
   site listed under "Template data lives on the subscription" (8+ files,
   including `CategoryDb`, `StatisticsDb`, `GroupingDb`, not just `ExpenseSearch`).
   Rename `recurring_expense_id` → `subscription_id` across DB, types, and code —
   this touches ~17 files, including the `Expense` schema field
   `recurringExpenseId` at `src/shared/expense/Expense.ts:82` and the API URL
   param names on `/api/subscription/:recurringExpenseId`
   (`src/server/api/SubscriptionApi.ts:46,55,80`). Plan a single coordinated PR.
6. Table-level consolidation (two sub-steps):
   - **6a (required for naming coherence)**: rename `recurring_expenses` →
     `subscriptions`. Without this, `expenses.subscription_id` points at
     `recurring_expenses.id`, which is a confusing mismatch for every future
     reader.
   - **6b (optional)**: merge `reports` rows into `subscriptions` (with
     `period_unit`, `period_amount`, `defaults`, and `next_missing` left NULL) and
     drop the `reports` table + `ReportApi`. Cleanest end state but not strictly
     necessary if the query-side dedup from step 3 is working well. Required
     schema changes if we do it: drop `NOT NULL` from `period_unit` and
     `period_amount` (schema lines 344, 347 — both are currently NOT NULL), and
     add a nullable `user_id INTEGER` column to `subscriptions` to preserve
     `reports.user_id` (recurring rows backfill from the template's user_id).

## Things we explicitly rejected

- **"Manual query wins its category"** — blocks legitimate narrow recurring
  expenses in a query-covered category; too coarse.
- **Keep static template sums but add a "historical" column next to them** — leaves
  the original drift problem in place and makes the UI explain two numbers for the
  same thing.
- **Rolling-average placeholder for auto-generated rows** — would destabilise the
  current edit-propagation flow: a single correction would ripple into future
  placeholder sums unpredictably. Stick with `defaults.sum` and lean on
  `confirmed=false` for variable bills.
