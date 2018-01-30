@echo off

set NODE_ENV=development

bash script/update-revision.sh

echo Starting server
node src/server/BookkeeperServer.js
