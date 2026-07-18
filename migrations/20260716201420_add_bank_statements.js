'use strict';

// Bank statement import (see docs/BANK_STATEMENTS.md). Statement rows are
// their own entity, not expenses: CSV exports from OP / S-pankki are parsed
// into statement_row, deduplicated by a hash over the normalized fields so
// overlapping exports can be re-uploaded safely. statement_upload is the
// audit record of each uploaded file.
exports.up = knex =>
  knex.raw(/*sql*/ `
    ALTER TABLE sources ADD COLUMN statement_format TEXT
      CHECK (statement_format IN ('op', 'spankki'));

    CREATE TABLE statement_upload (
      id SERIAL PRIMARY KEY,
      group_id INTEGER NOT NULL REFERENCES groups(id),
      source_id INTEGER NOT NULL REFERENCES sources(id),
      filename TEXT NOT NULL,
      format TEXT NOT NULL,
      uploaded_by INTEGER NOT NULL REFERENCES users(id),
      uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      row_count INTEGER NOT NULL,
      new_count INTEGER NOT NULL,
      duplicate_count INTEGER NOT NULL
    );

    CREATE TABLE statement_row (
      id SERIAL PRIMARY KEY,
      group_id INTEGER NOT NULL REFERENCES groups(id),
      source_id INTEGER NOT NULL REFERENCES sources(id),
      upload_id INTEGER NOT NULL REFERENCES statement_upload(id),
      booking_date DATE NOT NULL,
      value_date DATE NOT NULL,
      amount NUMERIC(10,2) NOT NULL,
      type TEXT NOT NULL,
      counterparty TEXT,
      counterparty_account TEXT,
      reference TEXT,
      message TEXT,
      archive_id TEXT,
      raw_line TEXT NOT NULL,
      row_hash TEXT NOT NULL,
      created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (source_id, row_hash)
    );

    CREATE INDEX statement_row_source_booking_date
      ON statement_row (source_id, booking_date);
  `);

exports.down = knex =>
  knex.raw(/*sql*/ `
    DROP TABLE IF EXISTS statement_row;
    DROP TABLE IF EXISTS statement_upload;
    ALTER TABLE sources DROP COLUMN IF EXISTS statement_format;
  `);
