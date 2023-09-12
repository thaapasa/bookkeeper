#!/bin/bash

pushd . >/dev/null
cd `dirname $0`/..

mkdir -p log

echo "Starting server"
NODE_ENV=production nohup bun run src/server/BookkeeperServer.ts >log/server.log 2>&1 &

popd >/dev/null
