'use strict';

/* eslint-disable no-undef */

exports.up = knex =>
  knex.raw(/*sql*/ `
    ALTER TABLE recurring_expenses
      ADD COLUMN filter JSONB,
      ADD COLUMN defaults JSONB;

    UPDATE recurring_expenses re
    SET
      filter = jsonb_build_object('categoryId', e.category_id)
        || CASE
             WHEN COALESCE(e.receiver, '') = '' THEN '{}'::jsonb
             ELSE jsonb_build_object('receiver', e.receiver)
           END,
      defaults = jsonb_build_object(
          'title', e.title,
          'sum', e.sum::TEXT,
          'type', e.type,
          'sourceId', e.source_id,
          'categoryId', e.category_id,
          'userId', e.user_id,
          'confirmed', e.confirmed,
          'description', e.description
        )
        || CASE
             WHEN COALESCE(e.receiver, '') = '' THEN '{}'::jsonb
             ELSE jsonb_build_object('receiver', e.receiver)
           END
    FROM expenses e
    WHERE re.template_expense_id = e.id;

    ALTER TABLE recurring_expenses
      ALTER COLUMN filter SET NOT NULL,
      ALTER COLUMN defaults SET NOT NULL;
  `);

exports.down = knex =>
  knex.raw(/*sql*/ `
    ALTER TABLE recurring_expenses
      DROP COLUMN defaults,
      DROP COLUMN filter;
  `);
