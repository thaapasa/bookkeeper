"use strict";

const Pool = require("pg-pool");

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
        return this.pool.connect().then(client => {
            return client.query(query, params).then(res => {
                const obj = (res.rows && res.rows.length > 0) ? res.rows[0] : undefined;
                client.release();
                return obj;
            }).catch(e => {
                client.release();
                console.error("Query error", e.message, e.stack);
            });
        });
    }

}

const db = new BookkeeperDB();

module.exports = db;
