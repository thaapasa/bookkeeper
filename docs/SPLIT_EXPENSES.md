# Split Expense Lineage (`split_id`)

This document describes how split lineage tracking works: what the `split_id` column
means, how it is assigned, and what the UI does with it. The server logic lives in
`src/server/data/ExpenseSplit.ts`; the client rendering in
`src/client/ui/expense/` (row menu, table ordering, row rendering).

## What it is

Splitting an expense ("Pilko") deletes the original row and creates the parts as new
`expenses` rows. Historically the parts carried no trail of where they came from.
`expenses.split_id` fixes that: all parts of one split share the same key, so the UI
can show them as belonging together.

The key is **purely informative**:

- It is an **opaque group key**, not a reference. A random UUID is generated at split
  (or link) time; nothing resolves it to a row.
- **No foreign key, by design.** The original expense is deleted at the moment it is
  split, so there is no row to point at, and nothing should prevent deleting any part
  later.
- It **never affects expense loading or balance math**. Dropping the column would only
  lose the visual grouping.

## Assignment rules

| Operation                    | Resulting `split_id`                                                                                                                                     |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Split an unsplit expense     | Fresh random UUID on every part                                                                                                                          |
| Re-split a part              | The part's existing key — all descendants of one original expense stay in one group                                                                      |
| Link two unlinked expenses   | Fresh random UUID on both                                                                                                                                |
| Link linked ↔ unlinked       | The existing key spreads to the unlinked side                                                                                                            |
| Link members of two groups   | Groups **merge**: every expense carrying either key is rewritten to one surviving key                                                                    |
| Unlink an expense            | Key cleared; if only one group member would remain, its key is cleared too (a group of one carries no information)                                       |
| Create / edit / copy expense | Never assigned or changed. `split_id` is **server-set only** — client input schemas (`ExpenseInput`) exclude it, and a client-supplied value is stripped |

Subscription-generated expenses (rows with `subscription_id`) are excluded from the
whole feature: they cannot be split or linked (rejected server-side with
`INVALID_SPLIT` / `INVALID_SPLIT_LINK`), the UI hides the menu items, and split parts
explicitly null out `subscription_id` so a part can never masquerade as a generated
row. The exclusion holds in the reverse direction too: a split-linked expense cannot
be converted to recurring (`INVALID_INPUT`; unlink first, then convert), so no row is
ever both subscription-generated and split-linked.

On split, the foreign currency annotation (`currency_id` + `original_currency_value`)
survives on the **first part only**, as a reference to what the original expense cost
abroad; the other parts are EUR-only.

## API

Both endpoints are group-scoped (`groupRequired`); ids in the path and body resolve
through group-scoped lookups, so another group's expenses cannot be linked or
unlinked (pinned by `src/integration/Security.test.ts`).

- `POST /api/expense/:id/link-split { targetExpenseId }` — manually mark two
  expenses as parts of the same split (for expenses split before this feature, or
  bookings that belong together). Implements the merge rules above.
- `POST /api/expense/:id/unlink-split` — remove an expense from its group,
  clearing a leftover group of one. No-op for unlinked expenses.

## UI behavior (month table)

- Within each day, group members are ordered adjacent (`groupSplitExpenses` in
  `src/shared/expense/SplitGrouping.ts`): the group anchors at its first member's
  position, trailing members pull up behind it. Grouping never crosses days — the
  same key on different days (e.g. after a date edit) renders ungrouped.
- Members after the first render as **continuation rows**: a dim, non-interactive
  link icon in the date slot (a ditto-style "same as above" marker), no avatar (when
  the user matches the previous row), no receiver (when it matches), no separating
  row border, and no date-click editing. The first member renders as a normal dated
  row with no split indication of its own.
- Row menu: "Linkitä pilkotuksi…" opens a dialog listing that day's other expenses;
  "Poista pilkkomislinkitys" appears only on linked expenses.

The search page renders the same rows but without the reordering or continuation
logic; linked expenses simply appear as normal rows there.

## Consistency stance

Informative-only means no invariants are enforced across a group: members can have
their dates edited apart, parts can be deleted down to a group of one (cleaned up
only on explicit unlink), and sums are not required to add up to anything. The UI
degrades gracefully in all such cases — rows simply render ungrouped.
