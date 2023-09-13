#!/bin/bash

SERVER_SRC="src/server src/shared src/typings"

pushd . >/dev/null
cd `dirname $0`/..

echo "Updating dependencies"
bun install || exit -1

mkdir -p deploy || exit -1
bun update-revisions

REV=`git rev-parse HEAD | cut -c 1-8`
echo "Packaging server files, revision $REV..."

bun clean || exit -1

tar czvf deploy/server-$REV.tar.gz $SERVER_SRC || exit -1

echo "Server packaged"

echo "Building client, revision $REV"

yarn clean || exit -1
yarn build-client || exit -1

cd dist
tar czvf ../deploy/client-$REV.tar.gz . || exit -1
cd ..

echo "Client built"

echo "Built revision $REV"

popd >/dev/null
