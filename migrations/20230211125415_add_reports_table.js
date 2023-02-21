'use strict';

exports.up = knex =>
  knex.raw(`--sql
    CREATE TABLE IF NOT EXISTS reports (
      id SERIAL PRIMARY KEY,
      group_id INTEGER REFERENCES groups(id),
      user_id INTEGER REFERENCES users(id),
      title TEXT NOT NULL,
      query JSONB NOT NULL
    );
  `);

exports.down = knex =>
  knex.raw(`--sql
    DROP TABLE IF EXISTS reports;
  `);
