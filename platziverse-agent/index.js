'use strict'

const debug = require('debug')('platzigram:agent')
const mqtt = require('mqtt')
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
  }
  // Esta funcion arrancara solo si el timer no se ha iniciado
  connect () {
    if (!this._started) {
      // Creamos la conexion al servidor con el metodo connect de mqtt y le pasamos el host al que se va a conectar
      this._started = true
      this._client = mqtt.connect(opts.mqtt.host)
      const opts = this._options
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
        this._timer = setInterval(() => {
          this.emit('agent/message', 'this is a message')
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
      this.emit('disconnected')
    }
  }
}

module.exports = PlatziverseAgent
