"use strict";

const merge = require("merge");

const env = process.env.NODE_ENV ? process.env.NODE_ENV : "development";

const config = merge({
    port: 3000,
    environment: env,
    version: require("../../package.json").version,
    revision: require("./revision"),
    sessionTimeout: "20 minutes"
}, require(`./config-${env}.js`));

module.exports = config;
