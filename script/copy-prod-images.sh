#!/usr/bin/env bash

# Usage:
# script/copy-prod-images.sh
#
# Mirrors the prod image directories to local. Skips files already in sync
# (size+mtime match) and removes local files that no longer exist in prod.

cd "$(dirname "$0")/.." || exit 1

REMOTE=deployer@pomeranssi:/home/deployer/data/bookkeeper/content
for dir in profile shortcut tracking grouping
do
  echo "Syncing $dir..."
  rsync -av --delete "$REMOTE/$dir/" "content/$dir/" || exit 1
done
