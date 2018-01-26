'use strict'

const debug = require('debug')('platziverse:mqtt')
const mosca = require('mosca')
const redis = require('redis')
const chalk = require('chalk')
const db = require('platziverse-db')
const config = require('../platziverse-db/config-db.js')

const { parsePayload } = require('../platziverse-utils/utils')
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
// Aca lo que hacemos es crear un objeto que itera sobre sus elementos en el orden que son insertados y devuelve un objeto de
// llave valor para cada iteracion
const clients = new Map()

let Agent, Metric

// Aca lo que hacemos es es registrar cuando un cliente se conecta, luego este nos entrega un id por cliente que
// genera automaticamente mqtt
server.on('clientConnected', client => {
  debug(`client connected: ${client.id}`)
  // Aca a nuestro objeto clients le seteamos solo el id del agente que se conecta, pero no le vamos a setear aun informacion
  // sobre el ya que no conocemos esta
  clients.set(client.id, null)
})
// Aca creamos un evento similar, pero cuando se desconecte un cliente
server.on('clientDisconnected', async client => {
  debug(`CLient disconnected: ${client.id}`)
  const agent = clients.get(client.id)

  if (agent) {
    // Mark agent as Disconnected
    agent.connected = false

    try {
      await Agent.createOrUpdate(agent)
    } catch (err) {
      return handleError(err)
    }
    // Delete Agent from clients list
    clients.delete(client.id)

    server.publish({
      topic: 'agent/disconnected',
      payload: JSON.stringify({
        uuid: agent.uuid
      })
    })
    debug(`Client (${client.id}) associated to Agent (${agent.uuid}) marked as disconnected`)
  }
})
// Ahora veamos el mas importante que es el de published que es el que nos va a distribuir nuestro mensaje a los distintos
// cliente conectados
server.on('published', async (packet, client) => {
  // topic viene siendo el tipo del mensaje, por ejemplo, Agent connected, agent disconnect, agent message
  debug(`Recieved: ${packet.topic}`)

  switch (packet.topic) {
    case 'agent/connected':
    case 'agent/disconnected':
      // Payload es el contenido del mensaje como tal
      debug(`Payload: ${packet.payload}`)
      break
    case 'agent/message':
      debug(`Payload: ${packet.payload}`)

      const payload = parsePayload(packet.payload)

      if (payload) {
        payload.agent.connected = true

        let agent
        try {
          agent = await Agent.createOrUpdate(payload.agent)
        } catch (err) {
          return handleError(err)
        }
        debug(`Agent ${agent.uuid} saved`)

        // NOtify agent is connected
        // Aca verificamos que nuestro objeto Map contenga la informacion de nuestro agent, si no existe lo que hacemos es
        // guardar la informacion del objeto y luego ya podemos hacer un broadcast a todos los agentes conectados por medio
        // de mqtt con el metodo publish, y como este nos recibe la informacion en string, tenemos que convertirlo a string
        // con el metodo JSON.stringify
        if (!clients.get(client.id)) {
          clients.set(client.id, agent)
          server.publish({
            topic: 'agent/connected',
            payload: JSON.stringify({
              agent: {
                uuid: agent.uuid,
                name: agent.name,
                hostname: agent.hostname,
                pid: agent.pid,
                connected: agent.connected
              }
            })
          })
        }
        // Store Metrics
        try {
          await Promise.all(payload.metrics.map(metric => Metric.create(agent.uuid, metric)))
        } catch (err) {
          return handleError(err)
        }
      }
      break
  }
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

function handleError (err) {
  console.error(`${chalk.red('[error]')} ${err.message}`)
  console.error(err.stack)
}
// Ahora siempre que hagamos aplicaciones JS tenemos por buena practica capturar las promesas fallidas y las excepciones
// no manejadas
process.on('uncaughtException', handleFatalError)
process.on('unhandledRejection', handleFatalError)
