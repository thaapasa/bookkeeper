#!/bin/sh

echo "Deploying bookkeeper to production..."

pushd . >/dev/null
cd `dirname $0`/..

npm install

script/stop-server.sh

~/bin/backup-bookkeeper.sh before-prod-update

npm run prod && \
    echo "Build successful!"

script/start-server.sh

popd >/dev/null

echo "Deployment done."
