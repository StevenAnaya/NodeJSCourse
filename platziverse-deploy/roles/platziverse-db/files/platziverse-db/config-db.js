'use strict'
const debug = require('debug')('platziverse:db:setup')

module.exports = function configDb () {
  return {
    database: process.env.DB_NAME || 'platziverse',
    username: process.env.DB_USER || 'steven',
    password: process.env.DB_PASS || 'zanahoria19',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: s => debug(s),
    operatorsAliases: false,
    setup: false
  }
}
