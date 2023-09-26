'use strict';

/* eslint-disable no-undef */

exports.up = knex =>
  knex.raw(/*sql*/ `
    CREATE TABLE IF NOT EXISTS shortcuts (
      id SERIAL PRIMARY KEY,
      created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      group_id INTEGER REFERENCES groups(id),
      user_id INTEGER REFERENCES users(id),
      sort_order INTEGER DEFAULT 0,
      title TEXT NOT NULL,
      icon TEXT,
      background TEXT,
      expense JSONB NOT NULL
    );

    -- Icon will be broken anyway, don't migrate it
    INSERT INTO shortcuts (group_id, user_id, title, background, expense, sort_order)
    SELECT default_group_id, id, title, background, vals, ROW_NUMBER() OVER()
    FROM (
      SELECT default_group_id, id,
        json_array_elements(expense_shortcuts)->>'title' AS title,
        json_array_elements(expense_shortcuts)->>'background' AS background,
        (json_array_elements(expense_shortcuts)->>'values')::jsonb AS vals
      FROM users
    ) data;

    ALTER TABLE users DROP COLUMN IF EXISTS expense_shortcuts;
  `);

exports.down = knex =>
  knex.raw(/*sql*/ `
    ALTER TABLE users ADD COLUMN IF NOT EXISTS expense_shortcuts JSON;

    UPDATE users SET expense_shortcuts =
      (SELECT to_json(array_agg(json_build_object(
        'title', title,
        'background', background,
        'values', expense
        )))
      FROM shortcuts WHERE shortcuts.user_id = users.id);

    DROP TABLE IF EXISTS shortcuts;
  `);
