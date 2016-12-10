#!/bin/sh

pushd . >/dev/null
cd `dirname $0`/..

npm install

script/stop-server.sh

npm run prod && \
    echo "Build successful!"

script/start-server.sh

popd >/dev/null
