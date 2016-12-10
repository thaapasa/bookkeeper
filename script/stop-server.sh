#!/bin/sh

echo "Shutting down server"
ps -ef | grep bookkeeper.server | grep -v grep | awk '{print $2;}' | xargs kill
