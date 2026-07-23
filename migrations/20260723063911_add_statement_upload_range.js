'use strict';

// Export date range of a statement upload: the min/max booking date over
// all rows in the uploaded file (including duplicates of earlier uploads),
// so the covered period is visible even when every row was skipped. Booking
// date is the column banks filter their exports by: in existing data the
// yearly (1.1.–31.12.) exports always stay inside the year on booking_date,
// while value_date (S-Pankki) and purchase_date (OP) leak outside it.
//
// Backfilled from the rows each upload owns — duplicate rows of the original
// file are not recoverable, but every existing upload imported at least one
// new row, so a close-enough range is always found. NULL only for future
// uploads of empty statement files.
exports.up = knex =>
  knex.raw(/*sql*/ `
    ALTER TABLE statement_upload ADD COLUMN range_start DATE;
    ALTER TABLE statement_upload ADD COLUMN range_end DATE;

    UPDATE statement_upload u
      SET range_start = r.min_date, range_end = r.max_date
      FROM (
        SELECT upload_id, MIN(booking_date) AS min_date, MAX(booking_date) AS max_date
          FROM statement_row
          GROUP BY upload_id
      ) r
      WHERE r.upload_id = u.id;
  `);

exports.down = knex =>
  knex.raw(/*sql*/ `
    ALTER TABLE statement_upload DROP COLUMN IF EXISTS range_start;
    ALTER TABLE statement_upload DROP COLUMN IF EXISTS range_end;
  `);
