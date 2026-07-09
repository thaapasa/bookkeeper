'use strict';

// Reference data owned by migrations, not by seeds. These tables are populated by their
// CREATE TABLE migration and must survive the wipe, or the app comes up with an empty
// currency list. Their sequences are left alone too: restarting a sequence under
// surviving rows would collide on the primary key at the next insert.
const REFERENCE_TABLES = ['currencies'];

const quoted = values => values.map(v => `'${v}'`).join(',');
const keepTables = quoted(REFERENCE_TABLES);
const keepSequences = quoted(REFERENCE_TABLES.map(t => `${t}_id_seq`));

exports.seed = knex =>
  knex.raw(/*sql*/ `do
$$
declare
  l_stmt text;
begin
  select 'truncate ' || string_agg(format('%I.%I', schemaname, tablename), ',')
    into l_stmt
  from pg_tables
  where schemaname in ('public')
  and tablename not like 'knex%'
  and tablename not in (${keepTables});

  execute l_stmt;
end;
$$;


do
$$
declare
  l_stmt text;
begin
  select string_agg(format('alter sequence %I.%I restart with 1;', schemaname, sequencename), '')
    into l_stmt
  from pg_sequences
  where schemaname in ('public')
  and sequencename not in (${keepSequences});

  execute l_stmt;
end;
$$;
`);
