#!/bin/bash

pushd . >/dev/null
cd `dirname $0`/..

PORT=`grep SERVER_PORT .env | sed -e 's/[^=]*=//'`

if [ "$PORT" = "" ]; then
  echo "Server port not configured"
  exit 0
fi

PIDS=`ps -ef | grep BookkeeperServer | grep -v grep | awk '{print $2;}'`

if [ "$PIDS" != "" ]; then
  echo "Server already running!"
  exit 0
fi

mkdir -p log

echo "Starting server (port $PORT)"
NODE_ENV=production nohup bun run src/server/BookkeeperServer.ts >log/server.log 2>&1 &
echo

popd >/dev/null

echo "Waiting for server to start"
./script/wait-for-it.sh localhost:$PORT
echo

sleep 0.33

echo "Server started, startup logs:"
cat log/server.log
