#!/usr/bin/env bash

cd `dirname $0`
docker build -t postgres-bookkeeper:9.4 .
