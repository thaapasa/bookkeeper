'use strict';

/* eslint-disable no-undef */

exports.up = knex =>
  knex.raw(/*sql*/ `
    -- Step 6b of the subscriptions rework: collapse the reports table
    -- into subscriptions so dedup operates on a single source.

    -- 1. Lift the title from defaults JSONB onto the row. Required for
    --    report-style subscriptions, which never have a defaults blob.
    ALTER TABLE subscriptions ADD COLUMN title TEXT;
    UPDATE subscriptions SET title = defaults->>'title';
    ALTER TABLE subscriptions ALTER COLUMN title SET NOT NULL;

    -- 2. Lift user_id off defaults JSONB onto the row, so reports
    --    (which carry user_id directly) can use the same shape.
    ALTER TABLE subscriptions ADD COLUMN user_id INTEGER REFERENCES users(id);
    UPDATE subscriptions SET user_id = (defaults->>'userId')::INTEGER;

    -- 3. Recurrence is now optional — only recurring rows carry a period
    --    + defaults. Drop NOT NULL on those columns and clear the DEFAULT
    --    on period_amount so report rows can stay genuinely NULL.
    ALTER TABLE subscriptions
      ALTER COLUMN period_unit DROP NOT NULL,
      ALTER COLUMN period_amount DROP NOT NULL,
      ALTER COLUMN period_amount DROP DEFAULT,
      ALTER COLUMN defaults DROP NOT NULL;

    -- 4. Copy reports into subscriptions. Period and defaults stay NULL;
    --    these rows carry only a filter and act as pure aggregators.
    INSERT INTO subscriptions (group_id, user_id, title, filter)
    SELECT group_id, user_id, title, query FROM reports;

    DROP TABLE reports;
  `);

exports.down = knex =>
  knex.raw(/*sql*/ `
    -- Structural restore only. Report rows are not split back out — a
    -- column-shape rollback does not need the data to be redistributed.
    CREATE TABLE IF NOT EXISTS reports (
      id SERIAL PRIMARY KEY,
      group_id INTEGER REFERENCES groups(id),
      user_id INTEGER REFERENCES users(id),
      title TEXT NOT NULL,
      query JSONB NOT NULL
    );

    -- Report-style rows have NULL period + NULL defaults; re-adding
    -- NOT NULL on those columns would fail as soon as one such row
    -- exists. Drop them first so the down can run cleanly. This is a
    -- destructive step — the rollback already accepts that report data
    -- isn't migrated back; this just makes the column-shape rollback
    -- actually executable.
    DELETE FROM subscriptions
      WHERE period_unit IS NULL OR period_amount IS NULL OR defaults IS NULL;

    ALTER TABLE subscriptions
      ALTER COLUMN defaults SET NOT NULL,
      ALTER COLUMN period_amount SET DEFAULT 1,
      ALTER COLUMN period_amount SET NOT NULL,
      ALTER COLUMN period_unit SET NOT NULL;

    ALTER TABLE subscriptions DROP COLUMN user_id;
    ALTER TABLE subscriptions DROP COLUMN title;
  `);
