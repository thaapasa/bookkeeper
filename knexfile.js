'use strict';
require('dotenv').config();

module.exports = {
  development: {
    client: 'postgresql',
    connection: process.env.DB_URL,
    migrations: {
      tableName: 'knex_migrations',
    },
  },

  production: {
    client: 'postgresql',
    connection: process.env.DB_URL,
    migrations: {
      tableName: 'knex_migrations',
    },
  },
};
