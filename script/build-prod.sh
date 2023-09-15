#!/bin/bash

pushd . >/dev/null
cd `dirname $0`/..

echo "Updating dependencies"
bun install || exit -1

mkdir -p deploy || exit -1
bun update-revisions

bun clean || exit -1

REV=`git rev-parse HEAD | cut -c 1-8`

echo "Building server, revision $REV..."
bun run build-server

echo "Packaging server files, revision $REV..."

cd build-server
tar czvf ../deploy/server-$REV.tar.gz . || exit -1
cd ..

echo "Server packaged"

echo "Building client, revision $REV"

bun clean || exit -1
bun build-client || exit -1

cd dist
tar czvf ../deploy/client-$REV.tar.gz . || exit -1
cd ..

echo "Client built"

echo "Built revision $REV"

popd >/dev/null
