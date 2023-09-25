'use strict';

/* eslint-disable no-undef */

exports.up = knex =>
  knex.raw(`--sql
    CREATE TABLE IF NOT EXISTS shortcuts (
      id SERIAL PRIMARY KEY,
      created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      group_id INTEGER REFERENCES groups(id),
      user_id INTEGER REFERENCES users(id),
      title TEXT NOT NULL,
      icon TEXT,
      background TEXT,
      expense JSONB NOT NULL
    );

    -- Icon will be broken anyway, don't migrate it
    INSERT INTO shortcuts (group_id, user_id, title, background, expense)
    SELECT default_group_id, id,
      json_array_elements(expense_shortcuts)->>'title',
      json_array_elements(expense_shortcuts)->>'background',
      (json_array_elements(expense_shortcuts)->>'values')::jsonb
    FROM users;

    ALTER TABLE users DROP COLUMN IF EXISTS expense_shortcuts;
  `);

exports.down = knex =>
  knex.raw(`--sql
    DROP TABLE IF EXISTS shortcuts;
  `);
