# Text Search Improvement Plan

> **Status: COMPLETED** — April 2026. `pg_trgm` enabled, GIN trigram indexes
> added on `expenses.title`, `receiver`, `description`, and the `search`
> predicate expanded to cover `description`. This document is retained as a
> historical decision record.
>
> Tracking issue: [thaapasa/bookkeeper#8](https://github.com/thaapasa/bookkeeper/issues/8)

## Prior State

- `search` param did case-insensitive ILIKE on `title` and `receiver` only
- `receiver` param was a separate filter on `receiver` only
- `description` was not searchable
- No indexes on any of these text fields
- Implementation in `src/server/data/ExpenseSearch.ts`

## Changes

### Migration: `pg_trgm` extension + per-column GIN trigram indexes

`migrations/20260425102134_expense_text_search_trgm.js`

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX expenses_title_trgm       ON expenses USING GIN (title gin_trgm_ops);
CREATE INDEX expenses_receiver_trgm    ON expenses USING GIN (receiver gin_trgm_ops);
CREATE INDEX expenses_description_trgm ON expenses USING GIN (description gin_trgm_ops);
```

### `ExpenseSearch.ts`

The `search` predicate now matches against `title`, `receiver`, **and**
`description`. The dedicated `receiver` filter (driven by the receiver
autocomplete suggestion) is unchanged.

### Frontend

No code changes — the existing search input still drives the `search`
parameter, which now covers description as well.

### Tests

`src/integration/ExpenseApi.test.ts` adds a `text search` describe block that
exercises matching against each field and verifies that the receiver filter
narrows results.

## Resolved decisions

- **Unified vs. separate fields** — kept both. The `receiver` filter is bound
  to the "Kohde:" autocomplete suggestion and represents a different intent
  (pin to one receiver) from free-text search. The `search` field is what got
  the description expansion.
- **Index strategy** — per-column GIN. The receiver filter still benefits from
  a dedicated index, and per-column lets the planner pick whichever predicate
  is active.
- **Substring vs. fuzzy** — started with ILIKE (substring); trigram indexes
  accelerate it. `similarity()` / `%` fuzzy matching can be added later if
  there's demand.
- **Data volume** — main user-visible win is the expanded scope (description).
  Indexes are cheap insurance against future growth.
