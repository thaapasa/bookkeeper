#!/bin/sh


pushd . >/dev/null
cd `dirname $0`/..

REV=`git rev-parse HEAD | cut -c 1-8`
echo "Deploying bookkeeper to production, revision $REV..."

npm install

script/stop-server.sh

~/bin/backup-bookkeeper.sh "before-update-$REV"

npm run prod && \
    echo "Build successful!"

script/start-server.sh

popd >/dev/null

echo "Deployment done."
