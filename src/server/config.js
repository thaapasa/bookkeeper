"use strict";

const env = process.env.NODE_ENV ? process.env.NODE_ENV : "development";

const config = Object.assign({
    port: 3100,
    environment: env,
    version: require("../../package.json").version,
    revision: "",
    refreshTokenTimeout: "2 weeks",
    commitId: require("./revision")
}, require(`./config-${env}.js`));

config.revision = config.commitId.substr(0, 8);

module.exports = config;
