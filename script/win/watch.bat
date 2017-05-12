@echo off

set NODE_ENV=development

watchify --debug src/client/client.js -v -t [ envify --NODE_ENV development ] -t [ babelify --presets [ es2015 react ] ] -o public/js/bookkeeper.js
