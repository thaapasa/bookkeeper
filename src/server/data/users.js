"use strict";

const db = require("./db");

function getAll() {
    return db.queryList("users.getAll", "SELECT id, email, firstname, lastname FROM users");
}

function getById(userId) {
    return db.queryObject("users.getById", "SELECT id, email, firstname, lastname FROM users WHERE id=$1", [userId])
}

const invalidCredentials = { code: "INVALID_CREDENTIALS", status: 401, cause: "Invalid username or password" };
function getByCredentials(username, password) {
    return db.queryObject("users.getByCredentials",
        "SELECT id, email, firstname, lastname FROM users WHERE email=$1 AND password=ENCODE(DIGEST($2, 'sha1'), 'hex')",
        [ username, password ]
    ).then(o => { if (o === undefined) throw invalidCredentials; else return o; });
}

module.exports = {
    getAll: getAll,
    getById: getById,
    getByCredentials: getByCredentials
};
