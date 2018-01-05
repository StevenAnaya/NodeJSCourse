'use strict'

const test = require('ava')
const proxyquire = require('proxyquire')
const sinon = require('sinon')

let db = null
let AgentStub = null
let sandbox = null
// Vamos a crear la configuracion para que no tengamos que probar sobre la base de datos real
let config = {
  logging: function () {}
}
// Este Stub es para la funcion de belongsTo que usamos en el index.js, necesitamos probar que esta 
// hace lo correcto
let MetricStub = {
  // Esto lo usamos para ver si la funcion belongsTo si es llamada, entonces spy nos permite conocer
  // cuantas veces fue llamada, con que parametros fue llamada y demas, esto nos es util para saber 
  // si el metodo esta funcionando
  belongsTo: sinon.spy()
}


// Vamos a hacer uso de los Hooks que nos entrega AVA, con esto podemos hacer que una funcion
// se ejecute siempre, antes o despues de un test.
test.beforeEach(async () => {
  // Aca le decimos a sinon que nos cree el sandbox, pero luego tenemos que reiniciar estos despues de cada prueba,
  // para eso usamos el Hook de after que tiene AVA
  sandbox = sinon.sandbox.create()
  // Lo que hacemos es crear estas funciones stubs, para que este no acceda a los verdaderos metodos de los 
  // modelos
  AgentStub = {
    // Aca vamos a hacer algo similar pero con un Sandbox, estos nos permiten crear contextos nuevos para 
    // cada vez que se ejecute la prueba, esto para tener cosas distintas en cada una.
    hasMany: sandbox.spy()
  }
  // Ahora necesitamos decirle  que no traiga el verdadero setupDatabase y que lo sobreescriba y 
  // que los metodos que le pasemos los cambie y nos retorne lo que queremos.
  const setupDatabase = proxyquire('../', {
    './models/agent': () => AgentStub,
    './models/metric': () => MetricStub
  })
  db = await setupDatabase(config)
})

test.afterEach(() => {
  // Le decimos que despues de cada test y que si esta creado el sandbox, que nos restaure al estado inicial el sandbox.
  sandbox && sinon.sandbox.restore()
})

test('Agent', t => {
  t.truthy(db.Agent, 'Agent service should exist')
})
// Aca le decimos a AVA que ejecute los test de forma serial y no en paralelo con los otros ya que como estamos 
// modificando el contexto de sinon en algunos test, entonces le decimos que los ejecute uno tras otro.
test.serial('Setup', t => {
  // Le decimos que al Stub que creamos con la funcion hasMany que creamos tambien como stub si fue llamada, esta propiedad
  // called la entrega Sinon.
  t.true(AgentStub.hasMany.called, 'AgentModel.hasMany was executed')
  t.true(AgentStub.hasMany.calledWith(MetricStub), 'Argument should be the MetricModel')
  t.true(MetricStub.belongsTo.called, 'MetricModel.belongsTo was executed')
  t.true(MetricStub.belongsTo.calledWith(AgentStub), 'Argument should be the AgentModel')
})
