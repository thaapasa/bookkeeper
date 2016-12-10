#!/bin/bash

ssh deployer@pomeranssi.fi "cd ~/bookkeeper && git pull && script/build-prod.sh"
