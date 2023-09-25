'use strict';

/* eslint-disable no-undef */

exports.up = knex =>
  knex.raw(/*sql*/ `
  ALTER TABLE users ADD COLUMN expense_shortcuts JSON;
`);

exports.down = knex =>
  knex.raw(/*sql*/ `
  ALTER TABLE users DROP COLUMN expense_shortcuts;
`);
