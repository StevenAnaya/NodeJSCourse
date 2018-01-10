'use strict'

const test = require('ava')
const proxyquire = require('proxyquire')
const sinon = require('sinon')

const agentFixtures = require('./fixtures/agent')

let db = null
let AgentStub = null
let sandbox = null
// Aca vamos a clonar un objeto single del fixture que creamos para que no tengamos una sola
// instancia con la que probar, asi ya tenemos 2, la que nos retorna el fixture agent y la que
// acabamos de crear
let single = Object.assign({}, agentFixtures.single)
let id = 1
let uuid = 'yyy-yyy-yyy'
// Aca vamos a crear los demas argumentos que necesitan los nuevos test de los nuevos metodos
let uuidArgs = {
  where: {
    uuid
  }
}

let connectedArgs = {
  where: { connected: true }
}

let usernameArgs = {
  where: { username: 'platzi', connected: true }
}

let newAgent = {
  uuid: '123-123-123',
  name: 'test',
  username: 'test',
  hostname: 'test',
  pid: 0,
  connected: false
}

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

  // ACa vamos a crear la funcion de findById ya que el agentModel que enviamos es un Stub, entonces
  // lo vamos a actualizar con la nueva funcion y ademas no le vamos aponer la funcion de sinon spy si no la 
  // funcion Stub para que cree la funcion y que este ya no este vacio
  AgentStub.findById = sandbox.stub()
  // Si corremos el test este va a seguir fallando por que el stub sigue estando vacio, para que podamos devolver algo 
  // cuando hagamos el llamado de esta funcion vamos a hacer uso de la funcion withArg de sinon y ademas de returns para
  // devolver un valor cuando esta se llame
  AgentStub.findById.withArgs(id).returns(Promise.resolve(agentFixtures.byId(id)))

  // Model findOne Stub
  // Aca hacemos un proceso similar al anterior pero solo es que este lo usamos para probar la funcion de createOrUpdate,
  // aca usamos tambien los fixtures pero con la diferencia que aca vamos a buscar un modelo por uuid. TAmbien este 
  // nos recibe un parametro uuidArgs que sera el objeto de consulta donde tenemos el where
  AgentStub.findOne = sandbox.stub()
  AgentStub.findOne.withArgs(uuidArgs).returns(Promise.resolve(agentFixtures.byUuid(uuid)))

  // Model Update Stub
  // Aca repetimos el modelo anterior solo que esta vez le pasamos el Agente single que tenemos de los fixtures y la 
  // condicion donde tenemos el where y este nos deberia retornar el mismo objeto single
  AgentStub.update = sandbox.stub()
  AgentStub.update.withArgs(single, uuidArgs).returns(Promise.resolve(single))

  // Model create Stub
  AgentStub.create = sandbox.stub()
  AgentStub.create.withArgs(newAgent).returns(Promise.resolve({
    toJSON () { return newAgent }
  }))
  
  // Model findAll Stub
  AgentStub.findAll = sandbox.stub()
  AgentStub.findAll.withArgs().returns(Promise.resolve(agentFixtures.all))
  AgentStub.findAll.withArgs(connectedArgs).returns(Promise.resolve(agentFixtures.connected))
  AgentStub.findAll.withArgs(usernameArgs).returns(Promise.resolve(agentFixtures.platzi))

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

test.serial('Agent#findById', async t => {
  // Aca usamos para el test el Stub y el mock que creamos para el objeto del Modelo del agente, este no se conecta
  // al modelo real de base de datos
  let agent = await db.Agent.findById(id)
  // Aca lo que hacemos es que nos aseguramos que la funcion de nuestro modelo Agente si sea llamada y ademas que sea solo 
  // llamada una vez
  t.true(AgentStub.findById.called, 'findById should be called on model')
  t.true(AgentStub.findById.calledOnce, 'findById should be called once')
  t.true(AgentStub.findById.calledWith(id), 'findById should be called with the specified argument')

  t.deepEqual(agent, agentFixtures.byId(id), 'should be the same')
})

test.serial('Agent#findByUuid', async t => {
  let agent = await db.Agent.findByUuid(uuid)

  t.true(AgentStub.findOne.called, 'findOne should be called on model')
  t.true(AgentStub.findOne.calledOnce, 'findOne should be called once')
  t.true(AgentStub.findOne.calledWith(uuidArgs), 'findOne should be called with the uuidArgs')

  t.deepEqual(agent, agentFixtures.byUuid(uuid), 'should be the same')
})

test.serial('Agent#findAll', async t => {
  let agents = await db.Agent.findAll()

  t.true(AgentStub.findAll.called, 'findAll should be called on model')
  t.true(AgentStub.findAll.calledOnce, 'findAll should be called once')
  t.true(AgentStub.findAll.calledWith(), 'should be called without args')

  t.is(agents.length, agentFixtures.all.length, 'agents should be the same amount')
  t.deepEqual(agents, agentFixtures.all, 'agents should be the same')
})

test.serial('Agent#findConnected', async t => {
  let agents = await db.Agent.findConnected()

  t.true(AgentStub.findAll.called, 'findAll should be called on model')
  t.true(AgentStub.findAll.calledOnce, 'findAll should be called once')
  t.true(AgentStub.findAll.calledWith(connectedArgs), 'findAll should be called with connected args')

  t.is(agents.length, agentFixtures.connected.length, 'agents should be the same amount')
  t.deepEqual(agents, agentFixtures.connected, 'agents should be the same')
})

test.serial('Agent#findByUsername', async t => {
  let agents = await db.Agent.findByUsername('platzi')

  t.true(AgentStub.findAll.called, 'findAll should be called on model')
  t.true(AgentStub.findAll.calledOnce, 'findAll should be called once')
  t.true(AgentStub.findAll.calledWith(usernameArgs), 'findAll should be called with username args')

  t.is(agents.length, agentFixtures.platzi.length, 'should be the same amount')
  t.deepEqual(agents, agentFixtures.platzi, 'agents should be the same')
})

test.serial('Agent#createOrUpdate - new user', async t => {
  let agent = await db.Agent.createOrUpdate(newAgent)

  t.true(AgentStub.findOne.called, 'findOne should be called on model')
  t.true(AgentStub.findOne.calledOnce, 'findOne should be called once')
  t.true(AgentStub.findOne.calledWith({
    where: { uuid: newAgent.uuid }
  }), 'findOne should be called with uuid args')
  t.true(AgentStub.create.called, 'create should be called on model')
  t.true(AgentStub.create.calledOnce, 'create should be called once')
  t.true(AgentStub.create.calledWith(newAgent), 'create should be called with specified args')

  t.deepEqual(agent, newAgent, 'agent should be the same')
})

test.serial('Agent#createOrUpdate - existing user', async t => {
  // Creamos el test para la creacion del agente pasandole por parametro el agente que tenemos en los fixtures
  let agent = await db.Agent.createOrUpdate(single)

  t.true(AgentStub.findOne.called, 'Should be called on model')
  t.true(AgentStub.findOne.calledTwice, 'FindOne should be called twice')
  t.true(AgentStub.update.calledOnce, 'update should be called once')

  t.deepEqual(agent, single, 'agent should be the same')
})
