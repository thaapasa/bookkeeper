#!/bin/bash

set -euo pipefail

pushd . >/dev/null
cd `dirname $0`/..

if [ $# -lt 1 ] ; then
  echo "USAGE: $0 [server/client]"
  exit
fi

REV=`git rev-parse HEAD`
VERSION=`cat package.json | grep "version" | head -n 1 | sed 's/.*"\([0-9.]*\)".*/\1/g'`
FILE=src/$1/revision.json


if [ -f $FILE ] ; then
  PREV_REV=`cat $FILE | jq -r '.commitId'`

  if [ "$REV" = "$PREV_REV" ] ; then
    echo "$1 revision already at $REV"
    exit
  fi
else
  PREV_REV="$REV"

  echo "Creating empty revision file"
  echo "{}" >$FILE
fi

COMMIT_MSG=`git log -1 --format=%s`

echo "Writing server version $VERSION (revision $REV) to $FILE"

git log $PREV_REV..$REV --format=%s | jq \
  --raw-input --slurp \
  --arg commitId "$REV" \
  --arg version "$VERSION" \
  --arg message "$COMMIT_MSG" \
  'split("\n") | { message: $message, commitId: $commitId, version: $version, commits: .[0:-1] }' >$FILE

popd >/dev/null
