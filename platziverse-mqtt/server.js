'use strict'

const debug = require('debug')('platziverse:mqtt')
const mosca = require('mosca')
const redis = require('redis')
const chalk = require('chalk')
const db = require('platziverse-db')
const config = require('../platziverse-db/config-db.js')
// Aca configuramos el objeto backend que queremos pasar, le decimos el tipo que sera, ademas le pasamos la
// instancia de de redis que obtenemos y luego le decimos que retorne los buffer ya que es mas facil
// procesar los datos ya que los buffers los entregan en binario
const backend = {
  type: 'redis',
  redis,
  return_buffers: true
}
// Mosca nos recibe un objeto de configuracion primero, este trae por defecto el puerto en el que va a correr,
// y ademas el backend que almacenara los mensajes que en este caso sera redis.
const settings = {
  port: 1883,
  backend
}
// Instanciamos el servidor de mosca
const server = new mosca.Server(settings)
// mosca nos entrega un server que es un event emiter, que nos permite agregar o emitir eventos cuando este listo el
// servidor o cuando ocurra ciertos eventos.

let Agent, Metric

// Aca lo que hacemos es es registrar cuando un cliente se conecta, luego este nos entrega un id por cliente que
// genera automaticamente mqtt
server.on('clientConnected', client => {
  debug(`client connected: ${client.id}`)
})
// Aca creamos un evento similar, pero cuando se desconecte un cliente
server.on('clientDisconnected', client => {
  debug(`CLient disconnected: ${client.id}`)
})
// Ahora veamos el mas importante que es el de published que es el que nos va a distribuir nuestro mensaje a los distintos
// cliente conectados
server.on('published', (packet, client) => {
  // topic viene siendo el tipo del mensaje, por ejemplo, Agent connected, agent disconnect, agent message
  console.log(`Recieved: ${packet.topic}`)
  // Payload es el contenido del mensaje como tal
  console.log(`Payload: ${packet.payload}`)
})

// Este evento ejecutara el console.log cuando este listo el servidor, como aqui vamos a crear la instancia de nuestra base de
// datos y resuelve con promesas, vamos a usar Async await en el evento para conectarnos a nuestra base de datos
server.on('ready', async () => {
  // Usamos el false para que no configure de nuevo la base de datos, solo que nos mantenga la instancia de la base de datos 
  // existente
  const services = await db(config(false)).catch(handleFatalError)

  Agent = services.Agent
  Metric = services.Metric

  console.log(`${chalk.green('[platziverse-mqtt]')} server is running`)
})
// Tenemos que tener siempre en cuenta que tenemos que manejar los errores, cuando ocurra un error lo manejamos, los imprimimos,
// miramos el stack del error y cerramos el proceso con nodejs
server.on('error', handleFatalError)

function handleFatalError (err) {
  console.error(`${chalk.red('[fatal error]')} ${err.message}`)
  console.error(err.stack)
  process.exit(1)
}
// Ahora siempre que hagamos aplicaciones JS tenemos por buena practica capturar las promesas fallidas y las excepciones
// no manejadas
process.on('uncaughtException', handleFatalError)
process.on('unhandledRejection', handleFatalError)
