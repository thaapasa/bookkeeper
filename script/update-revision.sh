#!/bin/sh

pushd . >/dev/null
cd `dirname $0`/..

REV=`git rev-parse HEAD`
FILE=src/server/revision.ts

echo "Updating server revision to $REV to $FILE"
echo "export default '$REV';" >$FILE

popd >/dev/null
