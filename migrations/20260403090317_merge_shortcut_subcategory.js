'use strict';

exports.up = knex =>
  knex.raw(/*sql*/ `
    UPDATE shortcuts
      -- Where subcategoryId is set and non-zero, use it as the categoryId
      SET expense = (expense - 'subcategoryId') || jsonb_build_object('categoryId', expense->'subcategoryId')
      WHERE (expense->>'subcategoryId')::int > 0;
    -- Remove subcategoryId from all remaining rows
    UPDATE shortcuts
      SET expense = expense - 'subcategoryId'
      WHERE expense \\? 'subcategoryId';
  `);

exports.down = knex =>
  knex.raw(/*sql*/ `
    -- Cannot reliably reverse: we don't know which categoryIds were originally subcategories
    SELECT true
  `);
