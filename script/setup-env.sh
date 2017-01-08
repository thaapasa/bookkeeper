#!/bin/bash

# Force all new branches to automatically use rebase
git config branch.autosetuprebase always

# Force master to use rebase.
git config branch.master.rebase true
