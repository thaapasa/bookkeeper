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

echo "Clearing local database"
dropdb -h localhost -p ${PORT} -U postgres postgres || exit -1
createdb -h localhost -p ${PORT} -U postgres postgres || exit -1

echo "Restoring prod DB dump"
pg_restore --role=postgres --no-owner -d "$DB_URL" --no-acl <$DUMP

rm $DUMP

psql "$DB_URL" -c "UPDATE users set image=case id % 2 when 0 then '2.jpg' else '1.png' end;"

echo "All done!"
