#!/bin/sh

echo "Active server:"
ps -ef | grep bookkeeper.server | grep -v grep
