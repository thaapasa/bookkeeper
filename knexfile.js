"use strict";
require("dotenv").config();

module.exports = {

  development: {
    client: 'pg',
    connection: process.env.DB_URL,
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  production: {
    client: 'pg',
    connection: process.env.DB_URL,
    migrations: {
      tableName: 'knex_migrations'
    }
  }

};
