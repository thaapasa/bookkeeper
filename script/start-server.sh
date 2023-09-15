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

if [ -f "log/server.log" ] ; then
  DATE=`date +"%Y-%m-%dT%H%M%S"`
  NEW_NAME="log/server-before-${DATE}.log"
  echo "Log file exists, renaming to $NEW_NAME"
  mv log/server.log $NEW_NAME
fi

mkdir -p log

echo "Starting server (port $PORT)"
NODE_ENV=production nohup bun run build-server/BookkeeperServer.js >log/start-server.log &
echo

popd >/dev/null

echo "Waiting for server to start"
./script/wait-for-it.sh localhost:$PORT
echo

sleep 0.33

echo "Server started, startup logs:"
cat log/server.log | bun pino-pretty
