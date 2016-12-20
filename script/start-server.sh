#!/bin/sh

pushd . >/dev/null
cd `dirname $0`/..

mkdir -p log

echo "Starting server"
NODE_ENV=production nohup node src/server/bookkeeper-server.js >log/server.log 2>&1 &

popd >/dev/null
