'use strict';

exports.seed = knex =>
  knex.raw(`do
$$
declare
  l_stmt text;
begin
  select 'truncate ' || string_agg(format('%I.%I', schemaname, tablename), ',')
    into l_stmt
  from pg_tables
  where schemaname in ('public')
  and tablename not like 'knex%';

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
  where schemaname in ('public');

  execute l_stmt;
end;
$$;
`);
