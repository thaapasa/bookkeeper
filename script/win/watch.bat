@echo off

set NODE_ENV=development

watchify --poll=true --debug src/client/client.js -v -t [ envify --NODE_ENV development ] -t [ babelify --presets [ es2015 react ] ] -o public/js/bookkeeper.js
