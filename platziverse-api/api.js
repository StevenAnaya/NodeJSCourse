'use strict'

const debug = require('debug')('platziverse:api:routes')
const express = require('express')
const { AgentNotFound, MetricsNotFound, NoAuthenticated, NoAuthorized } = require('./custom-errors')
// Aca creamos un router que nos permite definir rutas para cierto modulo en especifico para tener nuestro servidor 
// desacoplado entre se sus rutas, lo unico que hariamos es exportar la instancion del router y luego en el servidor 
// requerirlo y asignarlo a un middlewara dandole el nombre a la ruta con la que van a responder
const api = express.Router()

api.get('/agents', (req, res) => {
  debug('a request has come to /agents')
  res.send({})
})

api.get('/agent/:uuid', (req, res, next) => {
  const { uuid } = req.params

  if (uuid != 'yyy') {
    return next(new AgentNotFound(uuid))
  }

  res.send({ uuid })
})

api.get('/metrics/:uuid', (req, res) => {
  const { uuid } = req.params

  res.send({ uuid })
})

api.get('/metrics/:uuid/:type', (req, res) => {
  const { uuid, type } = req.params
  res.send({ uuid, type })
})

module.exports = api
