'use strict';

/* eslint-disable no-undef */

exports.up = knex =>
  knex.raw(/*sql*/ `
    ALTER TABLE expense_groupings ALTER COLUMN color SET NOT NULL, ALTER COLUMN color SET DEFAULT '';
    ALTER TABLE expense_groupings ADD COLUMN tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
  `);

exports.down = knex =>
  knex.raw(/*sql*/ `
    ALTER TABLE expense_groupings DROP COLUMN tags;
    ALTER TABLE expense_groupings ALTER COLUMN color DROP NOT NULL, ALTER COLUMN color DROP DEFAULT;
  `);
