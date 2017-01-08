"use strict";

const log = require("../../shared/util/log");
const db = require("./db");
const users = require("./users");
const sources = require("./sources");
const categories = require("./categories");
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

function createSessionInfo(token, userData, loginTime) {
    return {
        token: token,
        user: { id: userData.id, email: userData.email, firstName: userData.firstName, lastName: userData.lastName },
        group: { id: userData.groupId, name: userData.groupName },
        loginTime: loginTime
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
                "INSERT INTO sessions (token, user_id, login_time, expiry_time) VALUES ($1, $2, NOW(), NOW() + $3::INTERVAL)",
                [ token, user.id, config.sessionTimeout ]).then(r => token)
        });
}

function purgeExpiredSessions() {
    return db.update("sessions.purge", "DELETE FROM sessions WHERE expiry_time <= NOW()");
}

function getSession(token, groupId) {
    return purgeExpiredSessions()
        .then(p => db.queryObject("sessions.get_by_token",
            "SELECT s.token, s.user_id as id, s.login_time, u.username, u.email, u.first_name, u.last_name, g.id AS group_id, g.name as group_name FROM sessions s "+
            "INNER JOIN users u ON (s.user_id = u.id) " +
            "LEFT JOIN group_users go ON (go.user_id = u.id AND go.group_id = COALESCE($2, u.default_group_id)) " +
            "LEFT JOIN groups g ON (g.id = go.group_id) " +
            "WHERE s.token=$1 AND s.expiry_time > NOW()", [token, groupId]))
        .then(o => {
            if (o === undefined) throw new InvalidTokenError();
            else return db.update("sessions.update_expiry",
                "UPDATE sessions SET expiry_time=NOW() + $2::INTERVAL WHERE token=$1", [token, config.sessionTimeout])
                .then(u => o);
        })
        .then(o => createSessionInfo(o.token, o, o.loginTime));
}

function appendInfo(session) {
    log.info(session);
    return Promise.all([
        users.getGroups(session.user.id),
        sources.getAll(session.group.id),
        categories.getAll(session.group.id),
        users.getAll(session.group.id)
    ]).then(a => merge({ groups: a[0], sources: a[1], categories: a[2], users: a[3] }, session));
}

function createToken() {
    return randomBytes(20).then(buf => buf.toString("hex"));
}

module.exports = {
    login: login,
    logout: logout,
    getSession: getSession,
    appendInfo: appendInfo
};
