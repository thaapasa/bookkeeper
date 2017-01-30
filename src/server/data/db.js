"use strict";

const Pool = require("pg-pool");
const log = require("../../shared/util/log");
const merge = require("merge");
const config = require("../config");
const util = require("../../shared/util/util");

function camelCaseObject(o) {
    if (typeof o !== "object") return o;
    const r = {};
    Object.keys(o).forEach(k => r[util.underscoreToCamelCase(k)] = o[k]);
    return r;
}

const pool = new Pool(merge({ Promise: require("bluebird") }, config.db));

function queryFor(client, doRelease) {
    return (name, query, params, mapper) =>
        client.query({ text: query, name: name, values: params })
            .then(res => {
                const obj = mapper(res);
                if (doRelease) client.release();
                return obj;
            }).catch(e => {
                if (doRelease) client.release();
                log.error("Query error", e.message, e.stack);
                throw {code: "DB_ERROR", cause: e};
            });
}

class BookkeeperDB {

    constructor(query) {
        this.query = query;
    }

    queryObject(name, query, params) {
        return this.query(name, query, params, r => (r.rows && r.rows.length > 0) ? r.rows[0] : undefined)
            .then(camelCaseObject);
    }

    queryList(name, query, params) {
        return this.query(name, query, params, r => r.rows)
            .then(l => l.map(r => camelCaseObject(r)));
    }

    transaction(f) {
        log.debug("Starting transaction");
        return pool.connect().then(client => client.query("BEGIN")
            .then(() => f(new BookkeeperDB(queryFor(client, false))))
            .then(res => {
                log.debug("Committing transaction, result was", res);
                client.query("COMMIT");
                client.release();
                return res;
            })
            .catch(e => {
                log.debug("Rolling back transaction because of error", e);
                client.query("ROLLBACK");
                client.release();
                log.error("Query error", e.message, e.stack);
                throw {code: "DB_ERROR", cause: e};
            }));
    }

    insert(name, query, params) {
        return this.query(name, query, params, toId);
    }

    update(name, query, params) {
        return this.query(name, query, params, toRowCount);
    }
}


function toRowCount(r) {
    return r && r.rowCount !== undefined ? r.rowCount : r;
}

function toId(r) {
    return r && r.rows && r.rows.length > 0 ? r.rows[0].id : undefined;
}

const db = new BookkeeperDB((name, query, params, mapper) => {
    log.debug("SQL query", query, "with params", params);
    return pool.connect().then(client => queryFor(client, true)(name, query, params, mapper));
});

module.exports = db;
