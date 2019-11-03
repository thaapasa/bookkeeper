#!/bin/sh

pushd . >/dev/null
cd `dirname $0`/..

REV="$1"

if [ "$REV" == "" ] ; then 
  echo "Usage: $0 REVISION"
  exit -1
fi

echo "Installing new revision $REV"

yarn || exit -1

echo "Stopping server"
script/stop-server.sh || exit -1

echo "Backing up database"
~/bin/backup-bookkeeper.sh "before-server-$REV"

yarn clean || exit -1

echo "Extracting server..."

mkdir -p build-server || exit -1
cd build-server
tar xzvf ../deploy/server-$REV.tar.gz || exit -1
cd ..

echo "Extracting client..."
mkdir -p dist || exit -1
cd dist
tar xzvf ../deploy/client-$REV.tar.gz || exit -1
cd ..

echo "Running db migrations"
yarn migrate || exit -1

echo "Starting server"
script/start-server.sh || exit -1

popd >/dev/null
