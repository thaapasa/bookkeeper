# Text Search Improvement Plan

Improve expense text search by using PostgreSQL's `pg_trgm` extension for efficient
trigram-based ILIKE queries across title, description, and receiver fields.

## Current State

- `search` param does case-insensitive ILIKE on `title` and `receiver`
- `receiver` param is a separate filter on `receiver` only
- `description` is not searchable
- No indexes on any of these text fields
- Implementation in `src/server/data/ExpenseSearch.ts`

## Proposed Changes

### 1. Migration: enable pg_trgm and add trigram indexes

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX expenses_title_trgm ON expenses USING GIN (title gin_trgm_ops);
CREATE INDEX expenses_receiver_trgm ON expenses USING GIN (receiver gin_trgm_ops);
CREATE INDEX expenses_description_trgm ON expenses USING GIN (description gin_trgm_ops);
```

### 2. Update ExpenseSearch.ts

Modify the search query builder to search across all three fields (title, description,
receiver) when the `search` parameter is provided.

### 3. Update frontend

Potentially simplify the search UI if `receiver` is folded into the general text search.

## Open Questions

- **Unified vs separate fields**: Should `search` and `receiver` be merged into a single
  text input that searches all three columns? Or keep receiver as a separate exact/prefix
  filter for autocomplete use cases?

- **Index strategy**: One GIN index per column, or a single index on a concatenated
  expression like `(title || ' ' || COALESCE(description, '') || ' ' || receiver)`?
  Per-column is more flexible; combined is simpler if we always search all three.

- **Similarity vs substring**: `pg_trgm` supports both ILIKE (substring) and
  `similarity()`/`%` (fuzzy matching). ILIKE with trigram indexes is probably the right
  starting point, but fuzzy matching could be useful for typo tolerance.

- **Data volume**: With current data sizes, is this optimization even noticeable? The
  main benefit may be the expanded search scope (adding description) rather than
  performance.
