"use strict";

const log = require("../../shared/util/log");
const db = require("./db");
const users = require("./users");
const sources = require("./sources");
const categories = require("./categories");
const Promise = require("bluebird");
const randomBytes = Promise.promisify(require("crypto").randomBytes);
const config = require("../config");
const errors = require("../util/errors");

function InvalidTokenError(token) {
    this.status = 401;
    this.cause = "Invalid access token";
    this.code = "INVALID_TOKEN";
    this.token = token;
    return this;
}
InvalidTokenError.prototype = new Error();

function createSessionInfo(tokens, userData, loginTime) {
    return {
        token: tokens[0],
        refreshToken: tokens[1],
        user: { id: userData.id, email: userData.email, firstName: userData.firstName, lastName: userData.lastName, defaultGroupId: userData.defaultGroupId },
        group: { id: userData.groupId, name: userData.groupName, defaultSourceId: userData.defaultSourceId },
        loginTime: loginTime
    };
}

function login(username, password, groupId) {
    log.info("Login for", username);
    return users.getByCredentials(username, password, groupId)
        .then(user => createSession(user).then(tokens => createSessionInfo(tokens, user)));
}

function refresh(refreshToken, groupId) {
    log.info("Refreshing session with", refreshToken);
    return getUserInfoByRefreshToken(refreshToken, groupId)
        .then(user => createSession(user).then(tokens => createSessionInfo(tokens, user)));
}

function logout(session) {
    log.info("Logout for", session.token);
    if (!session.token) throw new InvalidTokenError();
    return db.update("sessions.delete", "DELETE FROM sessions WHERE (token=$1 AND refresh_token IS NOT NULL) " +
        "OR (token=$2 AND refresh_token IS NULL)", [session.token, session.refreshToken])
        .then(r => ({ status: "OK", message: "User has logged out", userId: session.userId } ));
}

function createSession(user) {
    return Promise.all([ createToken(), createToken() ])
        .then(tokens => {
            log.info("User", user.email, "logged in with token", tokens[0]);
            return db.insert("sessions.create",
                    "INSERT INTO sessions (token, refresh_token, user_id, login_time, expiry_time) VALUES "+
                    "($1, $2, $3, NOW(), NOW() + $4::INTERVAL), "+
                    "($2, NULL, $3, NOW(), NOW() + $5::INTERVAL)",
                [ tokens[0], tokens[1], user.id, config.sessionTimeout, config.refreshTokenTimeout]).then(r => tokens)
        });
}

function purgeExpiredSessions() {
    return db.update("sessions.purge", "DELETE FROM sessions WHERE expiry_time <= NOW()");
}

const tokenSelect = "SELECT s.token, s.refresh_token, s.user_id as id, s.login_time, u.username, u.email, u.first_name, u.last_name, u.default_group_id," +
    "g.id AS group_id, g.name as group_name, go.default_source_id FROM sessions s "+
    "INNER JOIN users u ON (s.user_id = u.id) " +
    "LEFT JOIN group_users go ON (go.user_id = u.id AND go.group_id = COALESCE($2, u.default_group_id)) " +
    "LEFT JOIN groups g ON (g.id = go.group_id) ";

function getSession(token, groupId) {
    return purgeExpiredSessions()
        .then(p => db.queryObject("sessions.get_by_access_token",
            tokenSelect + "WHERE s.token=$1 AND s.refresh_token IS NOT NULL AND s.expiry_time > NOW()", [token, groupId]))
        .then(o => {
            if (o === undefined) throw new InvalidTokenError();
            else return db.update("sessions.update_expiry",
                "UPDATE sessions SET expiry_time=NOW() + $2::INTERVAL WHERE token=$1", [token, config.sessionTimeout])
                .then(u => o);
        })
        .then(o => createSessionInfo([o.token, o.refreshToken], o, o.loginTime));
}

function getUserInfoByRefreshToken(token, groupId) {
    return purgeExpiredSessions()
        .then(p => db.queryObject("sessions.get_by_refresh_token",
            tokenSelect + "WHERE s.token=$1 AND s.refresh_token IS NULL AND s.expiry_time > NOW()", [token, groupId]))
        .then(errors.undefinedToError(InvalidTokenError, token))
        .then(o => db.update("sessions.purge_old_with_refresh", "DELETE FROM sessions WHERE refresh_token=$1 OR token=$1", [token])
            .then(x => o));
}

function appendInfo(session) {
    return Promise.all([
        users.getGroups(session.user.id),
        sources.getAll(session.group.id),
        categories.getAll(session.group.id),
        users.getAll(session.group.id)
    ]).then(a => Object.assign({ groups: a[0], sources: a[1], categories: a[2], users: a[3] }, session));
}

function createToken() {
    return randomBytes(20).then(buf => buf.toString("hex"));
}

module.exports = {
    login: login,
    refresh: refresh,
    logout: logout,
    getSession: getSession,
    appendInfo: appendInfo
};
