'use strict';

// Marks categories that are excluded from income/expense totals (yearly
// summary view). A flagged top-level category excludes its whole subtree;
// a flagged sub-category excludes only itself.
exports.up = knex =>
  knex.raw(/*sql*/ `
    ALTER TABLE categories ADD COLUMN exclude_from_totals BOOLEAN NOT NULL DEFAULT FALSE;
  `);

exports.down = knex =>
  knex.raw(/*sql*/ `
    ALTER TABLE categories DROP COLUMN IF EXISTS exclude_from_totals;
  `);
