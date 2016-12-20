"use strict";

const db = require("./db");

function getAll() {
    return db.queryList("users.getAll", "SELECT id, email, firstname, lastname FROM users");
}

function getById(userId) {
    return db.queryObject("users.getById", "SELECT id, email, firstname, lastname FROM users WHERE id=$1", [userId]);
}

function InvalidCredentialsError() {
    this.code = "INVALID_CREDENTIALS";
    this.status = 401;
    this.cause = "Invalid username or password";
}
InvalidCredentialsError.prototype = new Error();

function getByCredentials(username, password) {
    return db.queryObject("users.getByCredentials",
        "SELECT id, email, firstname, lastname FROM users WHERE email=$1 AND password=ENCODE(DIGEST($2, 'sha1'), 'hex')",
        [ username, password ]
    ).then(o => { if (o === undefined) throw new InvalidCredentialsError(); else return o; });
}

module.exports = {
    getAll: getAll,
    getById: getById,
    getByCredentials: getByCredentials
};
