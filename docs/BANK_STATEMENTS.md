# Bank Statement Import

This document describes how bank account statements (CSV exports from OP and S-pankki)
are imported into Kukkaro. Imported statement rows are stored as their own entity —
they are **not** expenses. They exist so that expenses entered into Kukkaro can later
be checked (and eventually matched) against what actually happened on the bank
account.

The parsers live in `src/shared/statement/` (shared: the client uses them for format
sniffing and preview, the server for the authoritative parse). Server logic lives in
`src/server/data/statement/`, the API in `src/server/api/StatementApi.ts`, and the UI
in `src/client/ui/statement/` (the "Tiliotteet" page).

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
4. On confirm, the **raw file** is POSTed to the server. The server re-parses it
   authoritatively — the client parse is only for sniffing and preview. This keeps
   the raw file as the source of truth, lets the server store `raw_line` per row,
   and avoids an API that accepts client-fabricated rows.
5. The import summary (parsed / new / duplicates / errors) is shown, and the row
   list refreshes.

## API

| Endpoint                         | Purpose                                                                                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/source/:id/statement` | Upload a CSV (multipart). Validates that the source has a `statement_format`, parses, dedupes, inserts. Returns `{ parsed, inserted, duplicates, errors }`. |
| `GET /api/statement/rows`        | List statement rows for a source + date range (drives the Tiliotteet row list).                                                                             |

All endpoints are group-scoped; every query constrains by `group_id`.

## UI

- **Source settings**: a statement-format dropdown (none / OP / S-pankki) on the
  source configuration.
- **Tiliotteet page**: drag-and-drop upload with preview and confirm (flow above),
  plus a month-filtered list of imported rows per source.

## Future: matching statements to expenses

Out of scope for the import feature, designed later. The intent is a UI that matches
statement rows to expenses with automatic guesses, so missing or mistyped expenses
stand out. The likely shape is a separate link table (`statement_row` ↔ `expenses`)
rather than a nullable FK, but nothing in the import schema commits to either; no
prep is needed now.
