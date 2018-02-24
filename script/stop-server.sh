#!/bin/sh

echo "Shutting down server"
ps -ef | grep BookkeeperServer | grep -v grep | awk '{print $2;}' | xargs kill
