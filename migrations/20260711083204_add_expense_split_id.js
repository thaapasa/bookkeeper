'use strict';

// Informative marker linking expenses that were split from the same original
// expense (or linked together manually). Not a foreign key on purpose: the
// original expense is deleted when it is split, and the value is an opaque
// group key (random UUID), not a reference to any row.
exports.up = knex =>
  knex.raw(/*sql*/ `
    ALTER TABLE expenses ADD COLUMN split_id UUID;
  `);

exports.down = knex =>
  knex.raw(/*sql*/ `
    ALTER TABLE expenses DROP COLUMN IF EXISTS split_id;
  `);
