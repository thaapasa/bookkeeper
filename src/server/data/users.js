"use strict";

const db = require("./db");

function getAll() {
    return db.queryList("users.getAll", "SELECT id, email, firstname, lastname FROM users")
        .then(undefinedToError(UserNotFoundError));
}

function getById(userId) {
    return db.queryObject("users.getById", "SELECT id, email, firstname, lastname FROM users WHERE id=$1", [userId])
        .then(undefinedToError(UserNotFoundError));
}

function InvalidCredentialsError() {
    this.code = "INVALID_CREDENTIALS";
    this.status = 401;
    this.cause = "Invalid username or password";
}
InvalidCredentialsError.prototype = new Error();

function UserNotFoundError() {
    this.code = "USER_NOT_FOUND";
    this.status = 404;
    this.cause = "User not found";
}
UserNotFoundError.prototype = new Error();

function getByCredentials(username, password) {
    return db.queryObject("users.getByCredentials",
        "SELECT id, email, firstname, lastname FROM users WHERE email=$1 AND password=ENCODE(DIGEST($2, 'sha1'), 'hex')",
        [ username, password ]
    ).then(undefinedToError(InvalidCredentialsError));
}

function undefinedToError(errorType) {
    return value => {
        if (value === undefined) throw new errorType();
        else return value;
    }
}

module.exports = {
    getAll: getAll,
    getById: getById,
    getByCredentials: getByCredentials
};
