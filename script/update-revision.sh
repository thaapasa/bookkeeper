#!/bin/sh

pushd . >/dev/null
cd `dirname $0`/..

REV=`git rev-parse HEAD | cut -c 1-8`
FILE=src/server/revision.js

echo "Updating server revision to $REV to $FILE"
echo
echo "\"use strict\";" >$FILE
echo "" >>$FILE
echo "module.exports = \"$REV\";" >>$FILE

popd >/dev/null
