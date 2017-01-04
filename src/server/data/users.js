"use strict";

const db = require("./db");
const errors = require("../util/errors");

function getAll() {
    return db.queryList("users.getAll", "SELECT id, email, firstname, lastname FROM users")
        .then(errors.undefinedToError(errors.NotFoundError, "USER_NOT_FOUND", "user"));
}

function getById(userId) {
    return db.queryObject("users.getById", "SELECT id, email, firstname, lastname FROM users WHERE id=$1", [userId])
        .then(errors.undefinedToError(errors.NotFoundError, "USER_NOT_FOUND", "user"));
}

function getGroups(userId) {
    return db.queryList("users.getGroups",
        "SELECT id, name FROM groups WHERE id IN (SELECT groupid FROM group_users WHERE userid=$1)", [userId], i => i);
}

function InvalidCredentialsError() {
    this.code = "INVALID_CREDENTIALS";
    this.status = 401;
    this.cause = "Invalid username or password";
}
InvalidCredentialsError.prototype = new Error();


function getByCredentials(username, password, groupid) {
    return db.queryObject("users.getByCredentials",
        "SELECT u.id, email, firstname, lastname, g.id as groupid, g.name as groupname FROM users u " +
        "LEFT JOIN group_users go ON (go.userid = u.id AND go.groupid = $3) " +
        "LEFT JOIN groups g ON (g.id = go.groupid) " +
        "WHERE email=$1 AND password=ENCODE(DIGEST($2, 'sha1'), 'hex')",
        [ username, password, groupid ]
    ).then(undefinedToError(InvalidCredentialsError));
}

function undefinedToError(errorType, params) {
    return value => {
        if (value === undefined) throw new errorType(params);
        else return value;
    }
}

module.exports = {
    getAll: getAll,
    getById: getById,
    getGroups: getGroups,
    getByCredentials: getByCredentials
};
