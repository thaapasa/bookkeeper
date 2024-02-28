'use strict';

/* eslint-disable no-undef */

exports.up = knex =>
  knex.raw(/*sql*/ `
    ALTER TABLE expense_groupings ADD COLUMN color TEXT;
  `);

exports.down = knex =>
  knex.raw(/*sql*/ `
    ALTER TABLE expense_groupings DROP COLUMN color;
  `);
