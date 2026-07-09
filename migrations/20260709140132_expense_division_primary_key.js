'use strict';

exports.up = knex =>
  knex.raw(/*sql*/ `
    ALTER TABLE expense_division
      ADD CONSTRAINT expense_division_pkey
      PRIMARY KEY (expense_id, user_id, type);
  `);

exports.down = knex =>
  knex.raw(/*sql*/ `
    ALTER TABLE expense_division
      DROP CONSTRAINT IF EXISTS expense_division_pkey;
  `);
