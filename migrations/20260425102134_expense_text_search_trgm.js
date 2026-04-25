'use strict';

exports.up = knex =>
  knex.raw(/*sql*/ `
    CREATE EXTENSION IF NOT EXISTS pg_trgm;

    CREATE INDEX expenses_title_trgm
      ON expenses USING GIN (title gin_trgm_ops);
    CREATE INDEX expenses_receiver_trgm
      ON expenses USING GIN (receiver gin_trgm_ops);
    CREATE INDEX expenses_description_trgm
      ON expenses USING GIN (description gin_trgm_ops);
  `);

exports.down = knex =>
  knex.raw(/*sql*/ `
    DROP INDEX IF EXISTS expenses_description_trgm;
    DROP INDEX IF EXISTS expenses_receiver_trgm;
    DROP INDEX IF EXISTS expenses_title_trgm;
  `);
