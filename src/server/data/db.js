"use strict";

const Pool = require("pg-pool");
const log = require("../util/log");

class BookkeeperDB {

    constructor() {
        this.pool = new Pool({
            database: "bookkeeper",
            user: "bookkeeper",
            password: "kakkuloskakahvit",
            port: 5432,
            ssl: false,
            Promise: require("bluebird")
        });
    }

    queryObject(query, params) {
        return this.query(query, params, r => (r.rows && r.rows.length > 0) ? r.rows[0] : undefined);
    }

    queryList(query, params) {
        return this.query(query, params, r => r.rows);
    }

    query(query, params, mapper) {
        log.debug("SQL query", query);
        return this.pool.connect().then(client => {
            return client.query(query, params).then(res => {
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

    insert(query, params) {
        return this.query(query, params, toRowCount);
    }

    update(query, params) {
        return this.query(query, params, toRowCount);
    }
}


function toRowCount(r) {
    return r && r.rowCount !== undefined ? r.rowCount : r;
}

const db = new BookkeeperDB();

module.exports = db;
