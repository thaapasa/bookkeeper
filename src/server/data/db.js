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

class BookkeeperDB {

    constructor() {
        this.pool = new Pool(merge({ Promise: require("bluebird") }, config.db));
    }

    queryObject(name, query, params) {
        return this.query(name, query, params, r => (r.rows && r.rows.length > 0) ? r.rows[0] : undefined)
            .then(camelCaseObject);
    }

    queryList(name, query, params) {
        return this.query(name, query, params, r => r.rows)
            .then(l => l.map(r => camelCaseObject(r)));
    }

    query(name, query, params, mapper) {
        log.debug("SQL query", query, "with params", params);
        return this.pool.connect().then(client => {
            return client.query({ text: query, name: name, values: params }).then(res => {
                const obj = mapper(res);
                client.release();
                return obj;
            }).catch(e => {
                client.release();
                console.error("Query error", e.message, e.stack);
                throw { code: "DB_ERROR", cause: e };
            });
        });
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

const db = new BookkeeperDB();

module.exports = db;
