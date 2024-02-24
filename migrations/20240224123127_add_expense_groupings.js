'use strict';

/* eslint-disable no-undef */

exports.up = knex =>
  knex.raw(/*sql*/ `
    CREATE TABLE expense_groupings (
      id SERIAL PRIMARY KEY,
      created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      group_id INTEGER NOT NULL REFERENCES groups(id),
      sort_order INTEGER NOT NULL DEFAULT 0,
      title TEXT NOT NULL,
      image TEXT
    );

    CREATE TABLE expense_grouping_categories (
      id SERIAL PRIMARY KEY,
      created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      expense_grouping_id INTEGER REFERENCES expense_groupings(id) ON DELETE CASCADE,
      category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE
    );
  `);

exports.down = knex =>
  knex.raw(/*sql*/ `
    DROP TABLE expense_grouping_categories;
    DROP TABLE expense_groupings;
  `);
