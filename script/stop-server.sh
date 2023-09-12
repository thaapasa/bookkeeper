#!/bin/bash

echo "Shutting down server"
PIDS=`ps -ef | grep BookkeeperServer | grep -v grep | awk '{print $2;}'`

if [ "$PIDS" != "" ]; then
  echo "Killing processes $PIDS"
  ps -ef | grep BookkeeperServer | grep -v grep | awk '{print $2;}' | xargs kill
else
  echo "Server not active"
fi
