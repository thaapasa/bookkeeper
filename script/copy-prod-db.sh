#!/usr/bin/env bash

# Usage:
# script/copy-prod-db.sh

export LANG="fi_FI.UTF-8"

cd "$(dirname "$0")/.." || exit 1

DUMP=prod.dump
source ./.env

if [ "$DB_URL" = "" ]
then
  echo "DB_URL is not set in .env"
  exit 1
fi

if [ "$PROD_DB_URL" = "" ]
then
  echo "PROD_DB_URL is not set in .env"
  exit 1
fi

echo "Loading prod DB to $DUMP"
pg_dump -x -O -Ft "$PROD_DB_URL" >$DUMP || exit 1

echo "Clearing local database (dropping and recreating public schema)"
psql "$DB_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" || exit 1

echo "Restoring prod DB dump"
pg_restore --no-owner --no-acl -d "$DB_URL" <$DUMP || exit 1

echo "Resetting user passwords"
psql "$DB_URL" -c "UPDATE users set password=encode(digest('salasana', 'sha1'), 'hex');" || exit 1

rm $DUMP

echo "All done!"
