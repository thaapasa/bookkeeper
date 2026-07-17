# Bank Statement Import

This document describes how bank account statements (CSV exports from OP and S-pankki)
are imported into Kukkaro. Imported statement rows are stored as their own entity —
they are **not** expenses. They exist so that expenses entered into Kukkaro can later
be checked (and eventually matched) against what actually happened on the bank
account.

The parsers live in `src/shared/statement/` (shared: the client uses them for format
sniffing and preview, the server for the authoritative parse). Server logic lives in
`src/server/data/StatementDb.ts`, the API in `src/server/api/StatementApi.ts`, and the
UI in `src/client/ui/statement/` (the "Tiliotteet" page).

## Concepts

- A **source** (money source) corresponds to one bank account — mostly. Some sources
  track cash or other flows and have no bank account behind them; those simply never
  get statements.
- A source that has a bank account behind it is configured with a **statement
  format** (`sources.statement_format`, nullable): `op` or `spankki`. Configured from
  the source settings UI. A source without a format cannot receive statement uploads.
- An uploaded CSV file becomes one **statement upload** (audit record) and a set of
  **statement rows**. Rows are deduplicated, so re-uploading the same statement — or
  a different export whose date range overlaps — is a safe no-op for the overlapping
  part.

## Database

### `statement_upload`

One row per uploaded file; audit trail for imports.

| Column                                      | Meaning                         |
| ------------------------------------------- | ------------------------------- |
| `id`, `group_id`, `source_id`               | Standard scoping                |
| `filename`                                  | Original filename of the upload |
| `format`                                    | `op` / `spankki` (as parsed)    |
| `uploaded_by`, `uploaded_at`                | Who and when                    |
| `row_count`, `new_count`, `duplicate_count` | Parse/import result summary     |

### `statement_row`

One row per bank transaction. Both formats normalize to the same shape.

| Column                        | Meaning                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `id`, `group_id`, `source_id` | Standard scoping                                                               |
| `upload_id`                   | The upload that **first** inserted this row (FK to `statement_upload`)         |
| `booking_date`                | Kirjauspäivä (`ISODate`)                                                       |
| `value_date`                  | Arvopäivä (OP) / Maksupäivä (S-pankki) (`ISODate`)                             |
| `amount`                      | Signed amount in EUR (`numeric`); negative = money out                         |
| `type`                        | Bank's transaction type text (e.g. `PKORTTIMAKSU`, `KORTTIOSTO`, `TILISIIRTO`) |
| `counterparty`                | Saaja/Maksaja name                                                             |
| `counterparty_account`        | Counterparty IBAN, when present                                                |
| `reference`                   | Payment reference number, when present                                         |
| `message`                     | Free-text message, when present                                                |
| `archive_id`                  | Bank's Arkistointitunnus                                                       |
| `raw_line`                    | The original CSV line, verbatim (debugging aid)                                |
| `row_hash`                    | Dedup key, see below                                                           |

Unique constraint: `(source_id, row_hash)`.

### Deduplication

`row_hash` is a SHA-256 over all normalized fields (dates, amount, type, counterparty,
account, reference, message, archive ID). Inserts use `ON CONFLICT DO NOTHING`; the
import result reports how many rows were new vs. already known.

Why not the archive ID alone: OP reuses the archive ID for recurring standing-order
payments. For example, a monthly loan payment carries the same
`20140117/593497/L62449` on every occurrence — the date prefix is when the standing
order was _created_, not when the payment happened. `(booking_date, archive_id)`
would suffice in practice, but hashing all fields is equally cheap and more robust.

Known limitation: two byte-identical transactions on the same day (e.g. a standing
order that genuinely fired twice with the same sum) collapse into one row. Considered
rare enough to accept; the duplicate count in the import summary is the tell.

## CSV formats

Both are `;`-separated, UTF-8 with BOM, decimal-comma amounts, and carry the same
eleven columns conceptually. Differences:

|              | OP                                                  | S-pankki                          |
| ------------ | --------------------------------------------------- | --------------------------------- |
| Header       | `"Kirjauspäivä";"Arvopäivä";"Määrä EUROA";…`        | `Kirjauspäivä;Maksupäivä;Summa;…` |
| Quoting      | All fields quoted                                   | Unquoted                          |
| Line endings | LF                                                  | CRLF                              |
| Dates        | ISO (`2026-01-02`)                                  | Finnish (`13.07.2026`)            |
| Empty fields | `""`                                                | `-`                               |
| Type field   | Numeric code + description (`162` / `PKORTTIMAKSU`) | Text (`KORTTIOSTO`)               |

**Format sniffing** uses the header row alone — the two headers are distinct, so no
content heuristics are needed. A file whose header matches neither format is rejected.

Normalizations applied by the parsers:

- OP prefixes are stripped: `ref=` from the reference, `Viesti: ` from the message
  (prefix only — a mid-message "Viesti:" is kept).
- S-pankki messages lose their wrapping single quotes; `-` fields become null.
- IBANs lose their grouping spaces (`FI21 1234 …` → `FI211234…`).
- The S-pankki counterparty depends on direction: receiver ("Saajan nimi") for
  outgoing rows, payer ("Maksaja") for incoming ones — the other side is the
  account owner. Likewise "Saajan tilinumero" is only stored for outgoing rows;
  on incoming rows it is the account's own IBAN, not counterparty data.
- Amounts are normalized to dot-decimal strings (`-579,12` → `"-579.12"`).

All transaction types are imported, including bank-internal ones (`BONUS`,
`MAKSUTAPAETU`) and incoming payments. Deciding which rows are relevant is the
matching phase's job, not the importer's.

## Upload flow

The Tiliotteet page has a drag-and-drop target. Everything before the final POST
happens client-side:

1. The dropped file is read as text (BOM stripped) and the format is sniffed from
   the header row. Unknown header → error, stop.
2. The client parses the full file with the shared parser and shows a **preview**:
   row count, date range, and the parsed rows, before anything is committed.
3. The target source is auto-selected: candidates are sources whose
   `statement_format` matches the sniffed format **and** that map the current user in
   `source_users`. Exactly one candidate → auto-selected (the common case: each user
   has one OP source and one S-pankki source they're mapped to). Multiple → dropdown
   with candidates listed first. None → dropdown of all bank sources, with a hint to
   configure the format on a source.
4. On confirm, the **raw file content** is POSTed to the server (as JSON
   `{ filename, content }` — statement CSVs are small). The server re-parses it
   authoritatively — the client parse is only for sniffing and preview. This keeps
   the raw file as the source of truth, lets the server store `raw_line` per row,
   and avoids an API that accepts client-fabricated rows.
5. The import summary (parsed / new / duplicates / errors) is shown, and the row
   list refreshes.

## API

| Endpoint                                 | Purpose                                                                                                                                                                                                                                                              |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/statement/upload/:sourceId`   | Upload a CSV (JSON body `{ filename, content }`). Validates that the source has a `statement_format` and that the file's format matches it, parses, dedupes, inserts. Returns `{ uploadId, format, rowCount, newCount, duplicateCount }`.                            |
| `GET /api/statement/rows`                | Paged list of statement rows for a source (`sourceId`, `limit` ≤ 200, `offset`, optional `startDate`/`endDate` on booking date). Returns `{ rows, total }`. Drives the Tiliotteet row list.                                                                          |
| `GET /api/statement/uploads`             | Upload batches for a source, latest first, with stored counts plus `currentRowCount` — the live number of rows the batch owns.                                                                                                                                       |
| `DELETE /api/statement/upload/:uploadId` | Delete a batch and the rows it owns. Because `upload_id` records the _first_ upload that saw each row, this removes exactly what the batch added — rows that already existed before it stay. Freed rows can be re-imported. Returns `{ uploadId, deletedRowCount }`. |

All endpoints are group-scoped; every query constrains by `group_id`.

## UI

- **Source settings**: a statement-format dropdown (none / OP / S-pankki) per source
  in the Tiedot page's Lähteet section.
- **Tiliotteet page**: drag-and-drop upload with preview and confirm (flow above).
  Below it, a per-source view with two tabs:
  - **Tapahtumat** — imported rows, paged (50 per page).
  - **Tuonnit** — upload batches with counts and per-batch delete (confirm dialog
    states how many rows the delete removes; a batch whose rows were all imported
    earlier by another batch owns nothing and deletes no rows).

## Matching statements to expenses

Matching links statement rows to the expenses that explain them, so missing or
mistyped expenses stand out. Server logic in `src/server/data/StatementMatchDb.ts`,
the preliminary matcher in `src/shared/statement/StatementMatcher.ts`, the UI in
`StatementMatchingView.tsx` (the Täsmäytys tab).

### Model

- `statement_match` links one statement row to one or more expenses (a purchase may
  be split into several expense rows). An expense matches at most one statement row
  (UNIQUE on `expense_id`) — multiple bank payments are never combined into one
  expense. Cascades from both sides: deleting an upload batch or an expense removes
  its links.
- Matched sums need **not** agree: part of an expense may have been paid another way.
- **Skipping** marks an item as reviewed-but-never-matching: `statement_row.skipped`
  for bank-internal rows (BONUS etc.), `expenses.statement_skip` for expenses paid
  outside the account. Skip flags and matches are mutually exclusive: matching
  clears skips, and skipping a matched item is rejected.
- `statement_row.purchase_date`: for OP card payments both bank dates are the
  booking date; the real purchase date is parsed from the message
  (`OSTOPVM YYMMDD`) into this column. It is **not** part of `row_hash` (it derives
  from the already-hashed message; hashing it would invalidate all existing hashes).
  The **effective date** of a row — used for windowing, bucketing, and match
  suggestions — is `COALESCE(purchase_date, value_date)`
  (`effectiveStatementDate()` in shared code).

### API

| Endpoint                                    | Purpose                                                          |
| ------------------------------------------- | ---------------------------------------------------------------- |
| `GET /api/statement/matching`               | Both sides for (`sourceId`, `month`): the month's expenses, and statement rows whose effective date falls within month ± 4 days, each with match/skip state. |
| `POST /api/statement/match`                 | Match one row to one or more expenses (same source enforced).    |
| `POST /api/statement/match/bulk`            | Confirm several matches at once (suggestion confirmation).       |
| `DELETE /api/statement/match/statement/:id` | Unmatch a statement row (all its expenses).                      |
| `DELETE /api/statement/match/expense/:id`   | Unmatch a single expense.                                        |
| `PATCH /api/statement/row/:id/skip`         | Set/clear a statement row's skip flag.                           |
| `PATCH /api/statement/expense/:id/skip`     | Set/clear an expense's statement-skip flag.                      |

### Preliminary matching

`suggestStatementMatches()` is a pure function, computed client-side when the view
loads — suggestions are never persisted until confirmed. Only unmatched, unskipped
items participate. Expenses sharing a `split_id` (parts of one split purchase, see
`docs/SPLIT_EXPENSES.md`) form one **unit** whose sum is the total of its open
parts — the bank sees one payment for the whole purchase. A unit is suggested for
a row when the expense date equals the row's effective date, the signed sums match
exactly (expenses and transfers ↔ negative amounts, incomes ↔ positive), and the
pairing is unambiguous: exactly one unit and one row share that (date, sum)
bucket. Anything ambiguous — including a split whose parts have been edited to
different dates — is left for manual matching instead of guessing.

### Täsmäytys UI

The tab binds to the **top-bar month navigator** (route
`/p/tiliotteet/m/yyyy-MM`). For the selected source and month it renders one
vertical list of per-date buckets, each with expenses on the left and statement
rows on the right, so the two sides stay aligned by date. Matched statement rows
move to their expenses' date bucket so the pair sits on one line; the row's own
date is then shown on the card. An SVG overlay (`MatchConnectors.tsx`) draws
bezier connectors between linked cards: subtle gray for confirmed matches,
dashed accent for suggestions, and bright accent for the current manual
selection (a preview of what "Täsmää valitut" would link).

- Suggested pairs show an "Ehdotus" badge; "Vahvista N ehdotusta" confirms them as
  one bulk call, and individual suggestions can be dismissed.
- Manual matching: click one statement row + one or more expenses, then "Täsmää
  valitut".
- Matched items are dimmed with a "Täsmätty" badge and can be unlinked; skipped
  items are dimmed with "Ohitettu" and a dashed border.
- "Luo kirjaus tästä" on an unmatched row opens the expense dialog prefilled from
  the row (date, sum, receiver, source, type by sign) and creates the match
  automatically on save.
