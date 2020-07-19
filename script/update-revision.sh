#!/bin/sh

pushd . >/dev/null
cd `dirname $0`/..

if [ $# -lt 1 ] ; then
  echo "USAGE: $0 [server/client]"
  exit
fi

REV=`git rev-parse HEAD`
VERSION=`cat package.json | grep "version" | head -n 1 | sed 's/.*"\([0-9.]*\)".*/\1/g'`
FILE=src/$1/revision.ts

echo "Writing server version $VERSION (revision $REV) to $FILE"

echo "export default {
  commitId: '$REV',
  version: '$VERSION',
};" >$FILE

popd >/dev/null
