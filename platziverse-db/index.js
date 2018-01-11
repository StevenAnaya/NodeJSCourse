'use strict'

const setupDatabase = require('./lib/db')
const setupAgentModel = require('./models/agent')
const setupMetricModel = require('./models/metric')
const defaults = require('defaults')
const setupAgent = require('./lib/agent')
const setupMetric = require('./lib/metric')

module.exports = async function (config) {
  config = defaults(config, {
    dialect: 'sqlite',
    pool: {
      max: 10,
      min: 0,
      idle: 10000
    },
    query: {
      raw: true
    },
    operatorsAliases: false
  })

  const sequelize = setupDatabase(config)
  const AgentModel = setupAgentModel(config)
  const MetricModel = setupMetricModel(config)

  // De esta forma creamos la relacion entre las tablas, decimos que el agente tiene  muchas metricas
  // y que una metrica pertenece a un agente
  AgentModel.hasMany(MetricModel)
  MetricModel.belongsTo(AgentModel)

  // Ahora vamos a comprobar que si nos estemos conectando a la base de datos con una funcion de sequelize
  // Esta lo que hace es hacer un query sencillo pero retorna una promesa, la resolvemos con await y luego sigue
  await sequelize.authenticate()

  // Aca lo que vamos  a hacer es que si la propieded de setup esta true, configure de nuevo la base
  // de datos y lo que hace es borrarla.
  if (config.setup) {
    await sequelize.sync({ force: true })
  }

  const Agent = setupAgent(AgentModel)
  const Metric = setupMetric(MetricModel, AgentModel)

  return {
    Agent,
    Metric
  }
}
