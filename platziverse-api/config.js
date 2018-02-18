'use strict'

const debug = require('debug')('platziverse-api:db')

module.exports = {
  db: {
    database: process.env.DB_NAME || 'platziverse',
    username: process.env.DB_USER || 'steven',
    password: process.env.DB_PASS || 'zanahoria19',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: s => debug(s),
    operatorsAliases: false
  },
  auth: {
    secret: process.env.SECRET || 'platzi'
  }
}
