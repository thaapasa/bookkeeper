#!/usr/bin/env bash

# Usage:
# script/copy-prod-images.sh

cd `dirname $0`/..

scp deployer@pomeranssi.fi:~/bookkeeper/content/content/profile/* content/content/profile/
scp deployer@pomeranssi.fi:~/bookkeeper/content/content/shortcut/* content/content/shortcut/
scp deployer@pomeranssi.fi:~/bookkeeper/content/content/tracking/* content/content/tracking/
