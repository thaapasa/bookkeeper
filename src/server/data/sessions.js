"use strict";

const log = require("../util/log");
const db = require("./db");
const users = require("./users");
const Promise = require("bluebird");
const randomBytes = Promise.promisify(require("crypto").randomBytes);
const config = require("../config");

function login(username, password) {
    log.info("Login for", username);
    return users.getByCredentials(username, password)
        .then(user => createSession(user).then(token => { return { user: user, token: token }; }));
}

function createSession(user) {
    return createToken()
        .then(token => {
            log.info("User", user.email, "logged in with token", token);
            return db.insert(
                "INSERT INTO sessions (token, userId, loginTime, expiryTime) VALUES ($1, $2, NOW(), NOW() + $3::INTERVAL)",
                [ token, user.id, config.sessionTimeout ]).then(r => token)
        });
}

function purgeExpiredSessions() {
    return db.update("DELETE FROM sessions WHERE expiryTime <= NOW()");
}

const invalidCredentials = { code: "INVALID_TOKEN", status: 401, cause: "Invalid access token" };
function getSession(token) {
    return purgeExpiredSessions()
        .then(p => db.queryObject("SELECT token, userId, loginTime FROM sessions WHERE token=$1 AND expiryTime > NOW()", [token]))
        .then(o => {
            if (o === undefined) throw invalidCredentials;
            else return db.update("UPDATE sessions SET expiryTime=NOW() + $2::INTERVAL WHERE token=$1", [token, config.sessionTimeout])
                .then(u => o);
        })
}

function createToken() {
    return randomBytes(20).then(buf => buf.toString("hex"));
}

module.exports = {
    login: login,
    getSession: getSession
};
