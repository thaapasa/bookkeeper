'use strict';

exports.up = knex =>
  knex.raw(/*sql*/ `
    ALTER TABLE users ADD COLUMN image_dark TEXT;
  `);

exports.down = knex =>
  knex.raw(/*sql*/ `
    ALTER TABLE users DROP COLUMN image_dark;
  `);
