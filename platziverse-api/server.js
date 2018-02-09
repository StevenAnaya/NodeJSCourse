'use strict'

const debug = require('debug')
const http = require('http')
const express = require('express')
const chalk = require('chalk')

const api = require('./api')
// Express nos sirve como un request handler que nos permite ejecutar funciones cada vez que se haga una peticion,
// creamos una instancia de la funcion de express, luego creamos un servidor http y le pasamos el request handler
// de express
const app = express()
const server = http.createServer(app)
const port = process.env.PORT || 3000
// Aqui requerimos nuestro en rutador para la ruta /api, aca le asignamos estas rutas al middleware a la ruta /api, asi que 
// todas las rutas definamos en nuestro router en el archivo de api.js van a quedar habilitadas en el el servidor, de esta 
// forma podemos crear rutas para distintas partes de nuestro servidor y asi mantener nuestro codigo desacoplado
app.use('/api', api)

// Express error handler
app.use((err, req, res, next) => {
  debug(`Error: ${err.message}`)

  res.status(err.code).send({ name: err.nameError, error: err.message })
})

// Aca vamos a menejar los errores de la aplicacion de forma global como hicimos en el servidor de MQTT
function handleFatalError (err) {
  console.error(`${chalk.red('[fatal error]')} ${err.message}`)
  console.error(err.stack)
  process.exit(1)
}
// Aca creamos unos listeners para cuando se presenten exceptions no capturdas o rechazos no capturados
process.on('uncaughtException', handleFatalError)
process.on('unhandledRejection', handleFatalError)

server.listen(port, () => {
  console.log(`${chalk.green('[platziverse-api]')} server listening port ${port}`)
})
