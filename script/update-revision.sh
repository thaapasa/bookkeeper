#!/bin/sh

pushd . >/dev/null
cd `dirname $0`/..

REV=`git rev-parse HEAD`
VERSION=`cat package.json | grep "version" | head -n 1 | sed 's/.*"\([0-9.]*\)".*/\1/g'`
SERVER_FILE=src/server/revision.ts
CLIENT_FILE=src/client/revision.ts

echo "Writing server version $VERSION (revision $REV)"

CONTENTS="export default {
  commitId: '$REV',
  version: '$VERSION',
};"

echo "$CONTENTS" >$SERVER_FILE
echo "$CONTENTS" >$CLIENT_FILE

echo "Wrote files $SERVER_FILE and $CLIENT_FILE"

popd >/dev/null
