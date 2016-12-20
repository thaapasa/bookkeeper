#!/bin/sh

pushd . >/dev/null
cd `dirname $0`/..

REV=`git rev-parse HEAD | cut -c 1-8`
echo "Updating server revision to $REV"
echo
echo "\"use strict\";\n\nmodule.exports = \"$REV\";\n" >src/server/revision.js

popd >/dev/null
