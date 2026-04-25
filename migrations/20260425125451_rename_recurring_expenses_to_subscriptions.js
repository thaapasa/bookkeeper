'use strict';

/* eslint-disable no-undef */

exports.up = knex =>
  knex.raw(/*sql*/ `
    ALTER TABLE recurring_expenses RENAME TO subscriptions;
    ALTER SEQUENCE recurring_expenses_id_seq RENAME TO subscriptions_id_seq;
    ALTER INDEX recurring_expenses_pkey RENAME TO subscriptions_pkey;
    ALTER TABLE subscriptions RENAME CONSTRAINT recurring_expenses_group_id_fkey
      TO subscriptions_group_id_fkey;
  `);

exports.down = knex =>
  knex.raw(/*sql*/ `
    ALTER TABLE subscriptions RENAME CONSTRAINT subscriptions_group_id_fkey
      TO recurring_expenses_group_id_fkey;
    ALTER INDEX subscriptions_pkey RENAME TO recurring_expenses_pkey;
    ALTER SEQUENCE subscriptions_id_seq RENAME TO recurring_expenses_id_seq;
    ALTER TABLE subscriptions RENAME TO recurring_expenses;
  `);
