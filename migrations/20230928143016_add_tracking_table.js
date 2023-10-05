'use strict';

/* eslint-disable no-undef */

exports.up = knex =>
  knex.raw(/*sql*/ `
    CREATE TABLE IF NOT EXISTS tracked_subjects (
      id SERIAL PRIMARY KEY,
      created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      group_id INTEGER NOT NULL REFERENCES groups(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      sort_order INTEGER NOT NULL DEFAULT 0,
      title TEXT NOT NULL,
      image TEXT,
      tracking_data JSONB NOT NULL DEFAULT '{}'
    );

  `);

exports.down = knex =>
  knex.raw(/*sql*/ `
    DROP TABLE IF EXISTS tracked_subjects;
  `);
