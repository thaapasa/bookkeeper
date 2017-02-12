#!/bin/bash

ssh deployer@pomeranssi.fi "bash --login -c 'cd ~/bookkeeper && git pull && script/build-prod.sh'"
