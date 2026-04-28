'use strict';

/* eslint-disable no-undef */

exports.up = knex =>
  knex.raw(/*sql*/ `
    -- Drop the cascade FK so deleting template rows does not nuke their recurring_expenses parents.
    ALTER TABLE recurring_expenses
      DROP CONSTRAINT recurring_expenses_template_expense_id_fkey;

    -- Templates' contents are already preserved in recurring_expenses.defaults
    -- (backfilled in 20260425120914_add_subscription_filter_defaults). Their
    -- expense_division rows cascade away with them.
    DELETE FROM expenses WHERE template = TRUE;

    ALTER TABLE expenses DROP COLUMN template;
    ALTER TABLE recurring_expenses DROP COLUMN template_expense_id;

    ALTER TABLE expenses RENAME COLUMN recurring_expense_id TO subscription_id;
    ALTER TABLE expenses
      RENAME CONSTRAINT expenses_recurring_expense_id_fkey TO expenses_subscription_id_fkey;

    DROP INDEX IF EXISTS expenses_recurring_expense_id_idx;
    -- Replace the dropped index under the new column name. Partial on
    -- NOT NULL since most expenses are not subscription-owned, and the
    -- subscription paths (delete-and-cleanup, target=after, division
    -- regeneration) all query by subscription_id.
    CREATE INDEX expenses_subscription_id_idx
      ON expenses (subscription_id)
      WHERE subscription_id IS NOT NULL;
  `);

exports.down = knex =>
  knex.raw(/*sql*/ `
    -- Structural restore only. Template rows are not reconstructed —
    -- by this point the subscription's defaults JSONB is the source of
    -- truth and reversing the migration would require re-running the
    -- "convert recurring to template" logic that this rework deletes.
    DROP INDEX IF EXISTS expenses_subscription_id_idx;
    ALTER TABLE expenses
      RENAME CONSTRAINT expenses_subscription_id_fkey TO expenses_recurring_expense_id_fkey;
    ALTER TABLE expenses RENAME COLUMN subscription_id TO recurring_expense_id;
    ALTER TABLE expenses ADD COLUMN template BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE recurring_expenses ADD COLUMN template_expense_id INTEGER;
  `);
