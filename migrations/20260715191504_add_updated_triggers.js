'use strict';

// Add an `updated` timestamp to expenses and move all `updated` column
// maintenance into a shared BEFORE UPDATE trigger. Previously only some
// update sites remembered to set updated=NOW() explicitly (and e.g.
// tracked_subjects never did); the trigger stamps every update uniformly.
const TABLES = ['expenses', 'shortcuts', 'expense_groupings', 'tracked_subjects'];

exports.up = knex =>
  knex.raw(/*sql*/ `
    ALTER TABLE expenses ADD COLUMN updated TIMESTAMPTZ NOT NULL DEFAULT NOW();
    UPDATE expenses SET updated = created;

    CREATE FUNCTION set_updated_timestamp() RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    ${TABLES.map(
      table => /*sql*/ `
        CREATE TRIGGER ${table}_set_updated
          BEFORE UPDATE ON ${table}
          FOR EACH ROW
          EXECUTE FUNCTION set_updated_timestamp();
      `,
    ).join('\n')}
  `);

exports.down = knex =>
  knex.raw(/*sql*/ `
    ${TABLES.map(
      table => /*sql*/ `
        DROP TRIGGER IF EXISTS ${table}_set_updated ON ${table};
      `,
    ).join('\n')}

    DROP FUNCTION IF EXISTS set_updated_timestamp();

    ALTER TABLE expenses DROP COLUMN IF EXISTS updated;
  `);
