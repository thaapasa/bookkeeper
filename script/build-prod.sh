#!/bin/bash

pushd . >/dev/null
cd `dirname $0`/..

echo "Updating dependencies"
bun install || exit -1

mkdir -p deploy || exit -1
bun update-revisions

bun clean || exit -1

REV=`git rev-parse HEAD | cut -c 1-8`

echo "Building client, revision $REV"

bun clean || exit -1
bun build-client || exit -1

cd dist
tar czvf ../deploy/client-$REV.tar.gz . || exit -1
cd ..

echo "Client built"

echo "Built revision $REV"

popd >/dev/null
