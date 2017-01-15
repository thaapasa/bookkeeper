#!/bin/sh

pushd . >/dev/null
cd `dirname $0`/..

REV=`git rev-parse HEAD | cut -c 1-8`

echo "Creating distribution version $REV"

rm -rf dist
mkdir -p dist
cp -rf public/* dist/

mv dist/css/bookkeeper.css dist/css/bookkeeper-$REV.css
mv dist/js/bookkeeper.js dist/js/bookkeeper-$REV.js
sed -e "s/css\/bookkeeper\.css/css\/bookkeeper-$REV.css/g" -e "s/js\/bookkeeper\.js/js\/bookkeeper-$REV.js/g" -i -- dist/index.html

popd >/dev/null
