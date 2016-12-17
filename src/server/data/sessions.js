"use strict";

const log = require("../util/log");
const users = require("./users");

function login(username, password) {
    log.info("createSession", username, password);
    return users.getByCredentials(username, password)
        .then(o => {
            console.log("Löyty", o);
            return o;
        });
}

function createSession(user) {

}

module.exports = {
    login: login
};
