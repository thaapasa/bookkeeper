"use strict";

const db = require("./db");
const errors = require("../util/errors");

function getAll(groupId) {
    return db.queryList("users.get_all",
        "SELECT id, username, email, first_name, last_name FROM users WHERE " +
        "(SELECT COUNT(*) FROM group_users WHERE user_id=users.id AND group_id=$1::INTEGER) > 0", [groupId])
        .then(errors.undefinedToError(errors.NotFoundError, "USER_NOT_FOUND", "user"));
}

function getById(groupId, userId) {
    return db.queryObject("users.get_by_id",
        "SELECT id, username, email, first_name, last_name FROM users WHERE id=$1::INTEGER AND "+
        "(SELECT COUNT(*) FROM group_users WHERE user_id=users.id AND group_id=$2::INTEGER) > 0", [userId, groupId])
        .then(errors.undefinedToError(errors.NotFoundError, "USER_NOT_FOUND", "user"));
}

function getGroups(userId) {
    return db.queryList("users.get_groups",
        "SELECT id, name FROM groups WHERE id IN (SELECT group_id FROM group_users WHERE user_id=$1)", [userId], i => i);
}

function InvalidCredentialsError() {
    this.code = "INVALID_CREDENTIALS";
    this.status = 401;
    this.cause = "Invalid username or password";
}
InvalidCredentialsError.prototype = new Error();


function getByCredentials(username, password, groupid) {
    return db.queryObject("users.get_by_credentials",
        "SELECT u.id, username, email, first_name, last_name, g.id as group_id, g.name as group_name FROM users u " +
        "LEFT JOIN group_users go ON (go.user_id = u.id AND go.group_id = $3) " +
        "LEFT JOIN groups g ON (g.id = go.group_id) " +
        "WHERE username=$1 AND password=ENCODE(DIGEST($2, 'sha1'), 'hex')",
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
