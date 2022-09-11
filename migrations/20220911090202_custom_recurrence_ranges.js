'use strict';

exports.up = knex =>
  knex.raw(`
    ALTER TYPE recurring_period RENAME VALUE 'monthly' TO 'months';
    ALTER TYPE recurring_period RENAME VALUE 'yearly' TO 'years';
    ALTER TYPE recurring_period ADD VALUE IF NOT EXISTS 'weeks';
    ALTER TYPE recurring_period ADD VALUE IF NOT EXISTS 'days';
    ALTER TYPE recurring_period ADD VALUE IF NOT EXISTS 'quarters';

    ALTER TABLE recurring_expenses RENAME COLUMN period TO period_unit;
    ALTER TABLE recurring_expenses ADD COLUMN period_amount SMALLINT NOT NULL DEFAULT 1;    
  `);

exports.down = knex =>
  knex.raw(`
    ALTER TYPE recurring_period RENAME TO old_rc;

    CREATE TYPE recurring_period AS ENUM ('monthly', 'yearly');

    ALTER TABLE recurring_expenses DROP COLUMN period_amount;
    ALTER TABLE recurring_expenses RENAME COLUMN period_unit TO period;
    ALTER TABLE recurring_expenses ALTER COLUMN period TYPE recurring_period USING CASE period 
      WHEN 'years' THEN 'yearly'::recurring_period
      ELSE 'monthly'::recurring_period
    END;

    DROP TYPE old_rc;
  `);
