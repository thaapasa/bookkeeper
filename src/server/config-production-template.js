"use strict";

// Instructions: Copy this file to config-production.js and edit the settings to match production configuration

module.exports = {
    db: {
        database: "bookkeeper",
        user: "bookkeeper",
        password: "kakkuloskakahvit",
        port: 5432,
        ssl: false
    },
    logLevel: "info",
    sessionTimeout: "20 minutes",
    showErrorCause: false
};
