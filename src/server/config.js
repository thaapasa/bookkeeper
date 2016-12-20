"use strict";

const merge = require("merge");

const env = process.env.NODE_ENV ? process.env.NODE_ENV : "development";

const config = merge({
    environment: env,
    port: 3000,
    sessionTimeout: "20 minutes"
}, require(`./config-${env}.js`));

module.exports = config;
