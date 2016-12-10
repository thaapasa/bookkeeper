#!/bin/sh

pushd . >/dev/null
cd `dirname $0`/..

npm install

npm run prod && \
    echo "Build successful!"

popd >/dev/null
