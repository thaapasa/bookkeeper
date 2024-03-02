'use strict';

/* eslint-disable no-undef */

exports.up = knex =>
  knex.raw(/*sql*/ `
    ALTER TABLE expense_groupings
      ADD COLUMN user_id INTEGER REFERENCES users(id),
      ADD COLUMN private BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN only_own BOOLEAN NOT NULL DEFAULT FALSE;
    UPDATE expense_groupings eg SET user_id = (SELECT user_id FROM group_users gu WHERE gu.group_id = eg.group_id LIMIT 1);
    ALTER TABLE expense_groupings ALTER COLUMN user_id SET NOT NULL;
  `);

exports.down = knex =>
  knex.raw(/*sql*/ `
    ALTER TABLE expense_groupings
      DROP COLUMN user_id,
      DROP COLUMN private,
      DROP COLUMN only_own;
  `);
