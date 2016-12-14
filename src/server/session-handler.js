"use strict"

const log = require("./util/log");

function createSession(username, password) {
    log.info("createSession", username, password);
    // TODO: tee hashi ja vertaa kantaan
    return username + "123";
}

module.exports = { createSession: createSession }
