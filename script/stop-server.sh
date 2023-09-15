#!/bin/bash

echo "Shutting down server"

runningServers() {
  PIDS=`ps -ef | grep BookkeeperServer | grep -v grep | awk '{print $2;}'`
}

runningServers
if [ "$PIDS" != "" ]; then
  echo "Killing processes $PIDS"
  echo $PIDS | xargs kill

  WAIT=5
  runningServers
  while [ "$PIDS" != "" ]; do
    echo "Waiting ${WAIT} s for servers to stop..."
    sleep 1
    WAIT="$(($WAIT-1))"

    if [ $WAIT -lt 1 ] ; then
      echo "Sending kill -9"
      runningServers
      echo $PIDS | xargs kill -9
    fi
    
    runningServers
  done
  echo "All running servers have been shut down"
else
  echo "Server not active"
fi
