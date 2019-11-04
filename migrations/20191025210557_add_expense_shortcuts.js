'use strict';

exports.up = knex =>
  knex.raw(`
  ALTER TABLE users ADD COLUMN expense_shortcuts JSON;
`);

exports.down = knex =>
  knex.raw(`
  ALTER TABLE users DROP COLUMN expense_shortcuts;
`);
