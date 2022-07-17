#!/bin/bash

echo "Active server:"
ps -ef | grep BookkeeperServer | grep -v grep
