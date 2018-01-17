'use strict'

const debug = require('debug')('platziverse:mqtt')
const mosca = require('mosca')
const redis = require('redis')
const chalk = require('chalk')
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

// Aca lo que hacemos es es registrar cuando un cliente se conecta, luego este nos entrega un id por cliente que 
// genera automaticamente mqtt
server.on('clientConnected', client => {
  debug(`client connected: ${client.id}`)
})

// Este evento ejecutara el console.log cuando este listo el servidor
server.on('ready', () => {
  console.log(`${chalk.green('[platziverse-mqtt]')} server is running`)
})
