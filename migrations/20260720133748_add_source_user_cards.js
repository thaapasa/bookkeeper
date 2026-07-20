'use strict';

// Bank cards attached to a source, per user (see docs/BANK_STATEMENTS.md).
//
// Each element is the last 4 digits of a card number, stored as text to
// preserve leading zeros. A (source, user) pair can have many cards: old
// replaced cards, credit/debit variants, Google Wallet virtual numbers.
// Array order is the display order in the formatted source name.
exports.up = knex =>
  knex.raw(/*sql*/ `
    ALTER TABLE source_users ADD COLUMN cards TEXT[] NOT NULL DEFAULT '{}';
  `);

exports.down = knex =>
  knex.raw(/*sql*/ `
    ALTER TABLE source_users DROP COLUMN IF EXISTS cards;
  `);
