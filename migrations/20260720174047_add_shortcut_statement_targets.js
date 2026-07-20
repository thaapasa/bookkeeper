'use strict';

// Statement counterparty patterns for shortcuts (see docs/BANK_STATEMENTS.md).
//
// When a statement row's counterparty contains one of these strings
// (case-insensitive), the matching view offers creating an expense from the
// shortcut, prefilled with the shortcut's data plus the row's date and sum.
// Substring match because counterparties can carry per-purchase suffixes
// ("Amazon.de*FX9W74Q55").
exports.up = knex =>
  knex.raw(/*sql*/ `
    ALTER TABLE shortcuts ADD COLUMN statement_targets TEXT[] NOT NULL DEFAULT '{}';
  `);

exports.down = knex =>
  knex.raw(/*sql*/ `
    ALTER TABLE shortcuts DROP COLUMN IF EXISTS statement_targets;
  `);
