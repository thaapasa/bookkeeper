#!/bin/bash

set -euo pipefail

pushd . >/dev/null
cd `dirname $0`/..

HOST=kukkaro.pomeranssi.fi
BRANCH=`git branch --show-current`

if [ "$BRANCH" != "master" ] ; then
  echo "Only deploy from the master branch!"
  exit 1
fi

export REV=`git rev-parse HEAD | cut -c 1-8`
script/build-prod.sh

echo "Copying files to production (rev $REV)..."

ssh deployer@$HOST "mkdir -p bookkeeper/deploy" || exit -1
scp deploy/client-$REV.tar.gz deployer@$HOST:~/bookkeeper/deploy || exit -1

echo "Deploying on server..."

ssh deployer@$HOST "bash --login -c 'cd ~/bookkeeper && git pull && script/install-prod.sh $REV'"

popd >/dev/null
