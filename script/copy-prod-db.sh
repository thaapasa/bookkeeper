#!/usr/bin/env bash

# Usage:
# script/copy-prod-db.sh [local-db-port]

export LANG="fi_FI.UTF-8"

DUMP=prod.dump
source ./.env

if [ "$DB_URL" = "" ]
then
  echo "DB_URL is not set in .env"
  exit -1
fi

if [ "$PROD_DB_URL" = "" ]
then
  echo "PROD_DB_URL is not set in .env"
  exit -1
fi

PORT=15488
[[ $# -gt 0 ]] && PORT="$1" && shift

if [ -f "$DUMP" ]
then
  echo "Using existing DB dump $DUMP"
else
  echo "Loading prod DB to $DUMP"
  pg_dump -x -O -Ft "$PROD_DB_URL" >$DUMP || exit -1
fi

echo "localhost:$PORT:*:*:postgres" >.pgpass
chmod 0600 .pgpass
export PGPASSFILE=.pgpass

echo "Clearing local database"
dropdb -h localhost -p ${PORT} --no-password -U postgres postgres || echo Could not clear local db
echo "Creating new empty database"
createdb -h localhost -p ${PORT} --no-password -U postgres postgres || exit -1

echo "Restoring prod DB dump"
pg_restore --role=postgres --no-owner -d "$DB_URL" --no-acl <$DUMP

psql "$DB_URL" -c "UPDATE users set password=encode(digest('salasana', 'sha1'), 'hex');"

rm $DUMP

echo "All done!"
