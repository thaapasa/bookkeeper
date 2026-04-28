'use strict';

/* eslint-disable no-undef */

exports.up = knex =>
  knex.raw(/*sql*/ `
    ALTER TABLE recurring_expenses RENAME TO subscriptions;
    ALTER SEQUENCE recurring_expenses_id_seq RENAME TO subscriptions_id_seq;
    ALTER INDEX recurring_expenses_pkey RENAME TO subscriptions_pkey;
    ALTER TABLE subscriptions RENAME CONSTRAINT recurring_expenses_group_id_fkey
      TO subscriptions_group_id_fkey;
    -- Postgres preserves NOT NULL / CHECK constraint names across a table
    -- rename, so realign them with the new table name too — otherwise the
    -- schema dump and any future ALTER TABLE error message would still
    -- refer to the table by its old name.
    ALTER TABLE subscriptions
      RENAME CONSTRAINT recurring_expenses_id_not_null TO subscriptions_id_not_null;
    ALTER TABLE subscriptions
      RENAME CONSTRAINT recurring_expenses_group_id_not_null TO subscriptions_group_id_not_null;
    ALTER TABLE subscriptions
      RENAME CONSTRAINT recurring_expenses_filter_not_null TO subscriptions_filter_not_null;
  `);

exports.down = knex =>
  knex.raw(/*sql*/ `
    ALTER TABLE subscriptions
      RENAME CONSTRAINT subscriptions_filter_not_null TO recurring_expenses_filter_not_null;
    ALTER TABLE subscriptions
      RENAME CONSTRAINT subscriptions_group_id_not_null TO recurring_expenses_group_id_not_null;
    ALTER TABLE subscriptions
      RENAME CONSTRAINT subscriptions_id_not_null TO recurring_expenses_id_not_null;
    ALTER TABLE subscriptions RENAME CONSTRAINT subscriptions_group_id_fkey
      TO recurring_expenses_group_id_fkey;
    ALTER INDEX subscriptions_pkey RENAME TO recurring_expenses_pkey;
    ALTER SEQUENCE subscriptions_id_seq RENAME TO recurring_expenses_id_seq;
    ALTER TABLE subscriptions RENAME TO recurring_expenses;
  `);
