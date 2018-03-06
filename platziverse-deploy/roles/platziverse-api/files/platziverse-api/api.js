'use strict'

const debug = require('debug')('platziverse:api:routes')
const express = require('express')
const asyncify = require('express-asyncify')
const db = require('platziverse-db')
const auth = require('express-jwt')
const guard = require('express-jwt-permissions')()
const { AgentNotFound, MetricsNotFound, NoAuthenticated, NoAuthorized } = require('./custom-errors')

const config = require('./config')
// Aca creamos un router que nos permite definir rutas para cierto modulo en especifico para tener nuestro servidor
// desacoplado entre se sus rutas, lo unico que hariamos es exportar la instancion del router y luego en el servidor
// requerirlo y asignarlo a un middlewara dandole el nombre a la ruta con la que van a responder
const api = asyncify(express.Router())

let services, Agent, Metric
// Este middleware es para que cuando nos hagan peticion a cualquier ruta nosotros creemos la instancia de la
// conexion de la base de datos, pero sera tambien un modelo singleton, si esta ya existe pues omitimos
// la conexion, luego capturamos los errores con el try y si ocurren se los pasamos al middleware de manejo
// de errores de express
api.use('*', async (req, res, next) => {
  if (!services) {
    debug('Connecting to database')
    try {
      services = await db(config.db)
    } catch (e) {
      next(e)
    }
    Agent = services.Agent
    Metric = services.Metric
  }
  next()
})
// Vamos a usar el modulo de jwt como middleware para autenticar las rutas de nuestra API
api.get('/agents', auth(config.auth),async (req, res, next) => {
  debug('a request has come to /agents')
  // El middleware de express-jwt es el que nos setea res.user para poder usado despues 
  // en el middleware
  const { user } = req

  if (!user || !user.username) {
    return next(new NoAuthorized())
  }

  let agents = []
  try {
    if (user.admin){
      agents = await Agent.findConnected()
    } else {
      agents = await Agent.findByUsername(user.username)
    }
  } catch (e) {
    return next(new AgentNotFound())
  }

  res.send(agents)
})

api.get('/agent/:uuid', auth(config.auth), async (req, res, next) => {
  const { uuid } = req.params

  let agent

  try {
    agent = await Agent.findByUuid(uuid)
  } catch (e) {
    return next(e)
  }

  debug(`request to /agent/${uuid}`)

  if (!agent) {
    return next(new AgentNotFound(uuid))
  }

  res.send(agent)
})

api.get('/metrics/:uuid', auth(config.auth), guard.check(['metrics:read']), async (req, res, next) => {
  const { uuid } = req.params

  debug(`request to /metrics/${uuid}`)

  let metrics = []

  try {
    metrics = await Metric.findByAgentUuid(uuid)
  } catch (e) {
    return next(new MetricsNotFound(uuid))
  }

  if (!metrics || metrics.length === 0) {
    return next(new MetricsNotFound(uuid))
  }

  res.send(metrics)
})

api.get('/metrics/:uuid/:type', auth(config.auth), async (req, res, next) => {
  const { uuid, type } = req.params

  debug(`request to /metrics/:uuid/:type`)

  let metrics = []

  try {
    metrics = await Metric.findByTypeAgentUuid(uuid, type)
  } catch (err) {
    next(new MetricsNotFound(uuid))
  }

  if (!metrics || metrics.length === 0) {
    return next(new MetricsNotFound(uuid))
  }

  res.send(metrics)
})

module.exports = api
