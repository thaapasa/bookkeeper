"use strict";

const log = require("../util/log");
const db = require("./db");
const users = require("./users");
const Promise = require("bluebird");
const randomBytes = Promise.promisify(require("crypto").randomBytes);

function login(username, password) {
    log.info("Login for", username);
    return users.getByCredentials(username, password)
        .then(user => createSession(user).then(token => { return { user: user, token: token }; }));
}

function createSession(user) {
    return createToken()
        .then(token => {
            log.info("User", user.email, "logged in with token", token);
            return db.insert("INSERT INTO sessions (token, userId, loginTime, expiryTime) VALUES ($1, $2, NOW(), NOW())",
                [ token, user.id ]).then(r => token)
        });
}

const invalidCredentials = { code: "INVALID_TOKEN", status: 401, cause: "Invalid access token" };
function getSession(token) {
    return db.queryObject("SELECT * FROM sessions WHERE token=$1", [token])
        .then(o => { if (o === undefined) throw invalidCredentials; else return o; });
}

function createToken() {
    return randomBytes(20).then(buf => buf.toString("hex"));
}

module.exports = {
    login: login,
    getSession: getSession
};
