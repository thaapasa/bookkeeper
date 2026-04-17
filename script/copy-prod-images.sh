#!/usr/bin/env bash

# Usage:
# script/copy-prod-images.sh

cd `dirname $0`/..

scp deployer@pomeranssi.fi:/home/deployer/data/bookkeeper/content/profile/* content/profile/
scp deployer@pomeranssi.fi:/home/deployer/data/bookkeeper/content/shortcut/* content/shortcut/
scp deployer@pomeranssi.fi:/home/deployer/data/bookkeeper/content/tracking/* content/tracking/
scp deployer@pomeranssi.fi:/home/deployer/data/bookkeeper/content/grouping/* content/grouping/
