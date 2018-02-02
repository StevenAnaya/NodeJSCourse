'use strict'

const debug = require('debug')('platzigram:agent')
const mqtt = require('mqtt')
const os = require('os')
const util = require('util')
const defaults = require('defaults')
const { parsePayload } = require('../platziverse-utils/utils')
const uuid = require('uuid')
// No hay necesidad de instalar algo extra para crear un event EventEmitter ya que este viene por defecto en 
// el core de NODE
const EventEmitter = require('events')
// Estas configuraciones son las que necesitara el cliente mqtt, (este cliente mqtt es el mismo que usamos desde la consola 
// solo que aca lo vamos a usar desde el codigo para poder enviar mensajes). el cliente mqtt necesita la ruta en la que estara 
// haciendo conexion al servidor mqtt
const options = {
  name: 'untitled',
  username: 'platzi',
  interval: 5000,
  mqtt: {
    host: 'mqtt://localhost'
  }
}

// Vamos a extender de la clase de EventEmitter, primero le vamos a setear el constructor y lo primero que haremos 
// es arrancar el constructor de la clase de la cual extendemos con el metodo super()
class PlatziverseAgent extends EventEmitter {
  constructor (opts) {
    super()
    // Aca vamos a crear unas referencias del timer o el contandor que vamos a crear, el started es para ver si esta 
    // arrancado y el timer es para saber el tiempo en el que vamos a hacer los intervalos.
    this._started = false
    this._client = null
    this._timer = null
    this._agentId = null
    this._options = defaults(opts, options)
    // Creamos un objeto Map para poder guardar los distintos tipos de metricas que registraremos.
    this._metrics = new Map()
  }
  // Funcion que agrega la metrica al objeto map que creamos
  addMetric (type, fn) {
    this._metrics.set(type, fn)
  }
  // Funcion que remueve la metrica del objeto map de metricas
  removeMetric(type) {
    this._metrics.delete(type)
  }

  // Esta funcion arrancara solo si el timer no se ha iniciado
  connect () {
    if (!this._started) {
      // Creamos la conexion al servidor con el metodo connect de mqtt y le pasamos el host al que se va a conectar
      this._started = true
      const opts = this._options
      this._client = mqtt.connect(opts.mqtt.host)
      // Ahora para poder recibir mensajes y tambien para poder enviarlso tenemos que suscribirnos a los eventos que habiamos 
      // definido en nuestro servidor de mqtt
      this._client.subscribe('agent/message')
      this._client.subscribe('agent/connected')
      this._client.subscribe('agent/disconnected')
      // Ahora vamos a crear los metodos o los listeners cuando ocurra un evento y se tenga que enviar un mensaje, creamos el de 
      // conectado, el de mensaje y tambien el de error que se ve a desconectar si ocurre algun fallo
      this._client.on('connect', () => {
        this._agentId = uuid.v4()

        this.emit('connected',this._agentId)

        // Con la funcion de JS setInterval le decimos que ejecute un emitter cada tanto tiempo
        this._timer = setInterval(async () => {
          // Solo vamos a querer reportar las metricas cuando estas tengan alguna, en ese caso 
          // tambien usamos un modulo de Node llamada os para recoger el nombre del host de la 
          // aplicacion.
          if (this._metrics.size > 0) {
            let message = {
              agent: {
                uuid: this._agentId,
                username: opts.username,
                name: opts.name,
                hostname: os.hostname() || 'localhost',
                pid: process.pid
              },
              metrics: [],
              timestamp: new Date().getTime()
            }
              // Aca vamos a hacer un tecnica llamada destructing, esto nos sirve para descomponer un objeto que 
            // tiene varios atributos y poderlos separar en dos variables y poder operar por separado en cada 
            // uno de ellos.
            for (let [ metric, fn ] of this._metrics) {
              // LUego para saber que lo que recibimos es un callback, lo unico que hacemos es usar la propiedad de 
              // la funcion con length igual que con los array, este nos dice si tenemos argumentos, si tenemos es que 
              // tenemos un callback
              if (fn.length === 1 ) {
                // Ahora podemos hacer uso del modulo de util de node que nos permite usar promisify para para convetir 
                // un callback en promesa, solo tenemos que pasarle la funcion por parametro
                fn = util.promisify(fn)
              }
              // Ahora la metrica que recibimos la vamos a poner dentro del objeto map que creamos, a este le pasamos el tipo 
              // o sea la metrica y luego el valor que vamos a resolver como una promesa con await
              message.metrics.push({
                type: metric,
                value: await Promise.resolve(fn())
              })
            }
            debug(`Sending`, message)
            // Aca vamos a publicar el mensaje que acabmos de crear y ademas lo tenemos que convertir a string para 
            // poder pasarlo
            this._client.publish('agent/message', JSON.stringify(message))
            this.emit('message', message)

            this.emit('agent/message', 'this is a message')
          }
        }, opts.interval)
      })

      this._client.on('message', (topic, payload) => {
        // Como ya sabemos que el payload que nos va a llegar siempre estara en string tenemos que convertirlo a JSON. para 
        // eso usamos el metodo que habiamos creado para el servidor de mqtt
        payload = parsePayload(payload)

        // Ahora aca vamos a hacer la condicion de broadcast de los mensajes que son de otros agentes y los mensajes que 
        // nosotros queremos retransmitir. Por defecto le vamos a decir que no vamos a retransmitir ningun mensaje.
        let broadcast = false
        switch (topic) {
          // Ahora vamos a crear los casos de broadcast si el payload es bueno, si contiene informacion del agente y si ademas 
          // el uuid del agente del mensaje es distinto al uuid del agente que nosotros instanciamos
          case 'agent/connected':
          case 'agent/disconnected':
          case 'agent/message':
            broadcast = payload && payload.agent && payload.agent.uuid != this._agentId
            break
        }
        // Ahora si yo voy a retransmitir emito el topic y el payload que me acaba de llegar
        if (broadcast) {
          this.emit(topic, payload)
        }   
      })

      this._client.on('error', () => this.disconnect())
    }
  }

  disconnect () {
    if(this._started) {
      // Cuando se vaya a desconectar vamos a limpiar la referencia del intervalo y le emitimos un mensaje de desconetado
      clearInterval(this._timer)
      this._started = false
      this.emit('disconnected', this._agentId)
      this._client.end()
    }
  }
}

module.exports = PlatziverseAgent
