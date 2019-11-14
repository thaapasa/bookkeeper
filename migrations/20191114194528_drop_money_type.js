'use strict';

exports.up = knex =>
  knex.raw(`
  ALTER TABLE expenses ALTER COLUMN sum TYPE DECIMAL(10, 2);
  ALTER TABLE expense_division ALTER COLUMN sum TYPE DECIMAL(10, 2);
`);

exports.down = knex =>
  knex.raw(`
  ALTER TABLE expenses ALTER COLUMN sum TYPE MONEY;
  ALTER TABLE expense_division ALTER COLUMN sum TYPE MONEY;
`);
