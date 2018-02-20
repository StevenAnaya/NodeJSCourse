'use strict'

const debug = require('debug')('platziverse:web')
const chalk = require('chalk')
const http = require('http')
const express = require('express')
const socket = require('socket.io')

// Este es el modulo recomendado en node para el manejo de las rutas y para hacer 
// las operaciones con la rutas de los archivos. Este modulo nos sirve en windows 
// y Linux.
const path = require('path')

const port = process.env.PORT || 8080

const app = express()
const server = http.createServer(app)

const io = socket(server)

// Bien sabemos que app.use() es la funcion que nos permite usar middlewares, y existe uno que nos 
// permite servir archivos estaticos para que nuestro servidor lo consuma. Vendria siendo como un 
// servidor apache normal o un archivo NGINX basico
app.use(express.static(path.join(__dirname, 'public')))
// path join es esto: ./public - ./ + public
// Ademas, __dirname es para obtener el nombre del directorio actual donde corre nuestro servidor

// Socket.io Web Sockets
// Socket.io es igual que MQTT, son eventEmitters/eventListeners el cual le podemos agregar los eventos 
// que queremos escuchar. Cuando un usuario se conecta a nuestro servidor (este) de Realtime nos entrega 
// un socket
io.on('connect', socket => {
  debug(`Connected ${socket.id}`)
  // Este evento es el que recibira nuestro servidor desde el frontend.
  socket.on('agent/message', payload => {
    console.log(payload)
  })

  setInterval(() => {
    // Este es un evento para emitir el mensaje hacia el frontend
    socket.emit('agent/message', { agent: 'xxx-yyy'})
  }, 4000)
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
})
