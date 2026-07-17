'use strict';

// Statement-to-expense matching (see docs/BANK_STATEMENTS.md).
//
// - statement_match links one statement row to one or more expenses; an
//   expense can be matched to at most one statement row. Cascades from both
//   sides: deleting an upload batch (which deletes its rows) or an expense
//   removes the link.
// - skipped / statement_skip mark rows/expenses reviewed as "will never
//   match anything on the other side".
// - purchase_date is the actual purchase date of OP card payments, parsed
//   from the message ("OSTOPVM 260101..."); for those rows both bank dates
//   are the (later) booking date. Backfilled from raw_line. Kept out of
//   row_hash so existing hashes stay stable.
exports.up = knex =>
  knex.raw(/*sql*/ `
    ALTER TABLE statement_row ADD COLUMN purchase_date DATE;
    ALTER TABLE statement_row ADD COLUMN skipped BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE expenses ADD COLUMN statement_skip BOOLEAN NOT NULL DEFAULT FALSE;

    UPDATE statement_row
      SET purchase_date = to_date('20' || substring(raw_line FROM 'OSTOPVM (\\d{6})'), 'YYYYMMDD')
      WHERE raw_line ~ 'OSTOPVM \\d{6}';

    CREATE TABLE statement_match (
      id SERIAL PRIMARY KEY,
      group_id INTEGER NOT NULL REFERENCES groups(id),
      statement_row_id INTEGER NOT NULL REFERENCES statement_row(id) ON DELETE CASCADE,
      expense_id INTEGER NOT NULL REFERENCES expenses(id) ON DELETE CASCADE UNIQUE,
      created TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX statement_match_row ON statement_match (statement_row_id);
  `);

exports.down = knex =>
  knex.raw(/*sql*/ `
    DROP TABLE IF EXISTS statement_match;
    ALTER TABLE expenses DROP COLUMN IF EXISTS statement_skip;
    ALTER TABLE statement_row DROP COLUMN IF EXISTS skipped;
    ALTER TABLE statement_row DROP COLUMN IF EXISTS purchase_date;
  `);
