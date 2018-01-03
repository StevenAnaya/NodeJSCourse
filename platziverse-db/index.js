'use strict'

const setupDatabase = require('./lib/db')
const setupAgentModel = require('./models/agent')
const setupMetricModel = require('./models/metric')

module.exports = async function (config) {
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

  const Agent = {}
  const Metric = {}

  return {
    Agent,
    Metric
  }
}
