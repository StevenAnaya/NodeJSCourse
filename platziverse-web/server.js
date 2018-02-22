'use strict'

const debug = require('debug')('platziverse:web')
const chalk = require('chalk')
const http = require('http')
const express = require('express')
const socket = require('socket.io')
const PlatziverseAgent = require('platziverse-agent')
const asyncify = require('express-asyncify')

// Este es el modulo recomendado en node para el manejo de las rutas y para hacer 
// las operaciones con la rutas de los archivos. Este modulo nos sirve en windows 
// y Linux.
const path = require('path')
const proxy = require('./proxy')
const { pipe } = require('./utils')

const port = process.env.PORT || 8080

const app = asyncify(express())
const server = http.createServer(app)

const io = socket(server)
const agent = new PlatziverseAgent()

// Bien sabemos que app.use() es la funcion que nos permite usar middlewares, y existe uno que nos 
// permite servir archivos estaticos para que nuestro servidor lo consuma. Vendria siendo como un 
// servidor apache normal o un archivo NGINX basico
app.use(express.static(path.join(__dirname, 'public')))
// path join es esto: ./public - ./ + public
// Ademas, __dirname es para obtener el nombre del directorio actual donde corre nuestro servidor

// Cuando hagan peticiones a nuestra rutas, no se llamara nuestro modulo de API de una vez, se llamara
// al proxy que creamos por seguridad y protejer nuestras apiKeys
app.use('/', proxy)

// Express error handler
app.use((err, req, res, next) => {
  debug(`Error: ${err.message}`)

  res.send({ name: err.nameError, error: err.message })
})

// Socket.io Web Sockets
// Socket.io es igual que MQTT, son eventEmitters/eventListeners el cual le podemos agregar los eventos 
// que queremos escuchar. Cuando un usuario se conecta a nuestro servidor (este) de Realtime nos entrega 
// un socket
io.on('connect', socket => {
  debug(`Connected ${socket.id}`)
  // Aca es donde usamos nuestro modulo de pipe para redistribuir todos los mensajes al socket. Asi 
  // evitamos tener que escribir todos los listeners y todos los emiters para cada uno de los eventos
  pipe(agent, socket)
})




function handleFatalError (err) {
  console.error(`${chalk.red('[fatal error]')} ${err.message}`)
  console.error(err.stack)
  process.exit(1)
}

process.on('uncaughtException', handleFatalError)
process.on('unhandledRejection', handleFatalError)

server.listen(port, () => {
  console.log(`${chalk.green('[platziverse-web]')} server listening on port ${port}`)
  agent.connect()
})
