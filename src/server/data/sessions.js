"use strict";

const log = require("../util/log");
const db = require("./db");
const users = require("./users");
const Promise = require("bluebird");
const randomBytes = Promise.promisify(require("crypto").randomBytes);
const config = require("../config");
const merge = require("merge");

function InvalidTokenError() {
    this.status = 401;
    this.cause = "Invalid access token";
    this.code = "INVALID_TOKEN";
    return this;
}
InvalidTokenError.prototype = new Error();

// const invalidToken = new Error({ code: "INVALID_TOKEN", status: 401, cause: "Invalid access token" });

function createSessionInfo(token, userdata, logintime) {
    return {
        token: token,
        user: { id: userdata.id, email: userdata.email, firstname: userdata.firstname, lastname: userdata.lastname },
        group: { id: userdata.groupid, name: userdata.groupname },
        logintime: logintime
    };
}

function login(username, password, groupid) {
    log.info("Login for", username);
    return users.getByCredentials(username, password, groupid)
        .then(user => createSession(user).then(token => createSessionInfo(token, user)));
}

function logout(session) {
    log.info("Logout for", session.token);
    if (!session.token) throw new InvalidTokenError();
    return db.update("sessions.delete", "DELETE FROM sessions WHERE token=$1", [session.token])
        .then(r => ({ status: "OK", message: "User has logged out" } ));
}

function createSession(user) {
    return createToken()
        .then(token => {
            log.info("User", user.email, "logged in with token", token);
            return db.insert("sessions.create",
                "INSERT INTO sessions (token, userid, logintime, expirytime) VALUES ($1, $2, NOW(), NOW() + $3::INTERVAL)",
                [ token, user.id, config.sessionTimeout ]).then(r => token)
        });
}

function purgeExpiredSessions() {
    return db.update("sessions.purge", "DELETE FROM sessions WHERE expiryTime <= NOW()");
}

function getSession(token, groupId) {
    return purgeExpiredSessions()
        .then(p => db.queryObject("sessions.getByToken",
            "SELECT s.token, s.userid as id, s.logintime, u.email, u.firstname, u.lastname, g.id AS groupid, g.name as groupname FROM sessions s "+
            "INNER JOIN users u ON (s.userid = u.id) " +
            "LEFT JOIN group_users go ON (go.userid = u.id AND go.groupid = $2) " +
            "LEFT JOIN groups g ON (g.id = go.groupid) " +
            "WHERE s.token=$1 AND s.expirytime > NOW()", [token, groupId]))
        .then(o => {
            if (o === undefined) throw new InvalidTokenError();
            else return db.update("sessions.updateExpiry",
                "UPDATE sessions SET expirytime=NOW() + $2::INTERVAL WHERE token=$1", [token, config.sessionTimeout])
                .then(u => o);
        })
        .then(o => createSessionInfo(o.token, o, o.logintime));
}

function appendGroups(session) {
    return users.getGroups(session.user.id)
        .then(g => merge({ groups: g }, session));
}

function createToken() {
    return randomBytes(20).then(buf => buf.toString("hex"));
}

module.exports = {
    login: login,
    logout: logout,
    getSession: getSession,
    appendGroups: appendGroups
};
