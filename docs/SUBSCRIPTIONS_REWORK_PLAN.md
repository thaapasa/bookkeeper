# Subscriptions Rework — Design Notes

**Status**: exploratory, not yet decided. See `docs/SUBSCRIPTIONS.md` for the current
implementation.

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
recurring-expense template is *automation only* (generate a placeholder row each
period so nothing is forgotten); it does not define a number.

Every subscription's displayed per-month / per-year figure is a rolling aggregate
over the last N months of actually-realised rows.

## Proposed direction — "filter containment"

Chosen over the simpler "manual query wins its category" rule because category is
too coarse (a `receiver=Shell` query should not block an unrelated lease bill in the
same fuel category) and because we still want auto-generation for naturally-recurring
bills even when their category is also covered by a report.

### Shape

- A **subscription** is: `{ title, filter: ExpenseQuery, recurrence?: RecurrencePeriod }`.
  - `filter` defines *what rows belong to this subscription*.
  - `recurrence` is optional: if present, the app auto-generates missing rows on the
    given cadence (replacement for today's template-expense mechanism).
- Every existing `RecurringExpense` migrates to a subscription with an auto-derived
  filter (reasonable default: `category + receiver`, editable afterwards).
- Every existing `ReportDef` migrates to a subscription with `recurrence: undefined`.

### Dedup via filter containment

- Drop `includeRecurring: false` from report queries. Everything sees everything.
- Each realised row contributes to **exactly one** subscription: the most specific
  filter that matches it.
- Specificity order (suggestion, to refine): exact `receiver` > text `search` >
  `categoryId` + modifiers > `categoryId` alone > category-tree expansion.
- Category rollups are the union of contributing rows, so no double counting even if
  two subscriptions nominally overlap.

### Baseline computation

- For every subscription: `baselinePerMonth = sum(matching rows in last N months) / N`.
- Same formula for both types. The presence or absence of `recurrence` does not
  change the number — it only affects whether the system inserts placeholder rows.
- N is a UI setting (today's 1 / 3 / 5 year filter repurposed; probably default 12
  months for baselines even when the display range is longer).

### UI implications

- Existing card-per-item layout stays, but both card types show the same "baseline
  from last N months" figure plus an optional "next expected" (for subscriptions
  with a recurrence attached).
- Recurring-only actions (edit template, toggle auto-generation, see next-missing)
  attach to the subscription when `recurrence` is set.
- Reports gain create/edit in the UI (currently POST /api/report exists but is not
  wired in, and there is no update endpoint).

## Open questions

1. **Specificity ordering** — do we hand-pick it, or let the user rank subscriptions
   explicitly when two filters overlap?
2. **Migration of existing recurring expenses** — is `category + receiver` a good
   enough default filter, or do we want the user to confirm each one?
3. **Placeholder rows vs. real rows** — when a recurrence generates a row before the
   bill is confirmed, should that row count toward the baseline immediately, or only
   after it is confirmed? (Today, recurrence fires and the row becomes a normal
   expense immediately.)
4. **Auto-generated amount** — today the template sum is used; with variable bills
   that is wrong. Options: use last-N average as the placeholder amount and flag it
   as estimated; insert a zero-amount row and require user to fill it; or leave
   amount null and surface a "needs attention" list.
5. **Data model migration** — merge `recurring_expenses` and `reports` into one
   `subscriptions` table, or leave both and add a `filter` column to
   `recurring_expenses`? Single-table is cleaner long-term but is a bigger jump.
6. **`expenses.recurring_expense_id` linkage** — still useful for tracing
   auto-generated rows, but no longer load-bearing for dedup. Keep it, but the
   semantics shift from "owner" to "generator".
7. **How does a user inspect dedup?** — If two subscriptions could match the same
   rows, the UI probably needs a "rows assigned to this subscription" view so the
   user can audit.
8. **Ended subscriptions** — do ended ones still contribute to historical baselines
   for the N-month window if they ended recently? Probably yes: if you paid rent for
   10 of the last 12 months, the average should reflect that.

## What stays the same

- `expenses` table and its semantics.
- Category hierarchy and grouping on the page.
- Pie chart + per-month toggle.
- The `/p/tilaukset` route and the page-level layout.

## Rough rollout shape (to flesh out later)

1. Add `filter: ExpenseQuery` column (JSONB) to `recurring_expenses`, backfill from
   `category + receiver` of the template expense.
2. Change the baseline computation for recurring expenses to use realised rows, keep
   reports as-is for now. Validates the "averaging" thesis against real data before
   any dedup changes.
3. Remove `includeRecurring: false` from report queries; add the containment dedup.
   Compare totals before/after on the prod dataset.
4. Unify the two types in the UI (shared card component, shared create/edit flow).
5. (Optional) DB unification into a single `subscriptions` table.

## Things we explicitly rejected

- **"Manual query wins its category"** — blocks legitimate narrow recurring
  expenses in a query-covered category; too coarse.
- **Keep static template sums but add a "historical" column next to them** — leaves
  the original drift problem in place and makes the UI explain two numbers for the
  same thing.
