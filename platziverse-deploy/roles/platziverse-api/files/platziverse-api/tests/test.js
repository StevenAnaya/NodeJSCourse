'use strict'

const test = require('ava')
// Esto es como una herramienta que permite hacer peticiones HTTP con aserciciones
const request = require('supertest')
const sinon = require('sinon')
const proxy = require('proxyquire')
const util = require('util')
const config = require('../config')

let sandbox = null
let server = null
let dbStub = null
let token = null
let AgentStub = {}
let MetricStub = {}
let agentUuid = 'yyy-yyy-yyy'
let wrongAgentUuid = 'aaa-aaa-aaa'
let typeMetric = 'CPU'
let wrongToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InN0dmVuIiwiaWF0IjoxNTE4OTg5NDIzfQ.laaKrU-XYaZoJrRRmg8_c'

const agentFixtures = require('../../platziverse-testing-utils/fixtures/agent')
const metricsFixtures = require('../../platziverse-testing-utils/fixtures/metric')
const auth = require('../auth')
// Lo que hacemos es volver la funcion de auth que nos recibe callback en una funcion asincrona,
// usando el modulo de node promisify
const sign = util.promisify(auth.sign)

test.beforeEach(async () => {
  sandbox = sinon.sandbox.create()

  dbStub = sandbox.stub()
  dbStub.returns(Promise.resolve({
    Agent: AgentStub,
    Metric: MetricStub
  }))
  // En este pedazo de codigo es donde seteamos los stubs para que cuando hagan el request al api y llame los metodos de la base de datos
  // llame a estos stubs y no a los reales, entonces lo que hacemos es agregarselos al sandbox, luego le decimos que cuando los llamen, 
  // con o sin argumentos debe retornar una promesa resuelta con el resultado que deseamos
  AgentStub.findConnected = sandbox.stub()
  AgentStub.findConnected.returns(Promise.resolve(agentFixtures.connected))
  
  AgentStub.findByUuid = sandbox.stub()
  AgentStub.findByUuid.withArgs(agentUuid).returns(Promise.resolve(agentFixtures.byUuid(agentUuid)))
  AgentStub.findByUuid.withArgs(wrongAgentUuid).returns(Promise.resolve(null))

  MetricStub.findByAgentUuid = sandbox.stub()
  MetricStub.findByAgentUuid.withArgs(agentUuid).returns(Promise.resolve(metricsFixtures.findByAgentUuid(agentUuid)))
  MetricStub.findByAgentUuid.withArgs(wrongAgentUuid).returns(Promise.resolve(null))

  MetricStub.findByTypeAgentUuid = sandbox.stub()
  MetricStub.findByTypeAgentUuid.withArgs(agentUuid, typeMetric).returns(Promise.resolve(metricsFixtures.findByTypeAgentUuid(agentUuid, typeMetric)))
  MetricStub.findByTypeAgentUuid.withArgs(wrongAgentUuid, typeMetric).returns(Promise.resolve(null))

  token = await sign({ admin: true, username: 'platzi' }, config.auth.secret)

  // Aqui lo que hacemos es usar proxyquire para que cuando hagan los llamados al los requires que tenemos en el archivo principal 
  // del api, entregue los stubs que nosotros hicimos. en este caso entregaria el stub de la base de datos, que contendria 
  // el Stub del modelo de metricas y del modelo de agent. Luego cuando llamen las rutas del router api entregue lo mismo.
  const api = proxy('../api', {
    'platziverse-db': dbStub
  })

  server = proxy('../server', {
    './api': api
  })
})
// Aca restauramos los stubs para cada uno de los test
test.afterEach(async () => {
  sandbox && sinon.sandbox.create()
})
// el cb() es para trabajar con callbacks, en este caso no vamos a trabajar con async/await ya que
// supertest trabaja con callbacks, de lo contrario podriamos usar async await sin ningun problema
test.serial.cb('/api/agents', t => {
  // aca tenemos que ejecutar request para podar probar el servidor, para esto tenemos que tener una instancia del
  // servidor. Pero como obtnemos esta?... Miremos el codigo en el archivo del Server.
  request(server)
  // Podemos encadenar metodos con request, podemos hacer la peticion get a la ruta del servidor, luego con
  // expect() podemos decirle el resultado que esperamos y con .end() le indicamos que vamos a hacer con la
  // respuesta de este request. Ahi es donde metemos AVA y le decimos que sea falsy, o sea que no debe occurrir
  // ningun error y luego con deepEqual validamos que sea igual la respuesta, por ultimo se usa t.end() solo
  // cuando usamos test con callbacks
    .get('/api/agents')
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.falsy(err, 'should not return an error')
      let body = JSON.stringify(res.body)
      let expected = JSON.stringify(agentFixtures.connected)
      t.deepEqual(body, expected, 'response should be the expected')
      t.end()
    })
})

test.serial.cb('/api/agents - wrong JWT', t => {
  request(server)
  .get('/api/agents')
  .set('Authorization', `Bearer ${wrongToken}`)
  .expect(401)
  .expect('Content-Type', /json/)
  .end((err, res) => {
    t.truthy(err, 'Should return an error')
    t.end()
  })
})

test.serial.cb('/api/agent/:uuid', t => {
  request(server)
  .get(`/api/agent/${agentUuid}`)
  .set('Authorization', `Bearer ${token}`)
  .expect(200)
  .expect('Content-Type', /json/)
  .end((err, res) => {
    t.falsy(err, 'should not return an error')
    let body = JSON.stringify(res.body)
    let expected = JSON.stringify(agentFixtures.byUuid('yyy-yyy-yyy'))
    t.deepEqual(body, expected, 'response should be the expected')
    t.end()
  })
})

test.serial.cb('/api/agent/:uuid not found', t => {
  request(server)
  .get(`/api/agent/${wrongAgentUuid}`)
  .set('Authorization', `Bearer ${token}`)  
  .expect(404)
  .expect('Content-type', /json/)
  .end((err,res) => {
    if (err) {
      console.log(err)
    }
    t.truthy(res.body.error, 'should be return an error')
    // regex lo que hace es buscar en el objeto una coincidencia, si la encuentra retornar true y pasa la asercion
    t.regex(res.body.error, /not found/, 'Should contain a not found error')
    t.end()
  })
})

test.serial.cb('/api/agent/:uuid - wrong JWT', t => {
  request(server)
  .get(`/api/agent/${agentUuid}`)
  .set('Authorization', `Bearer ${wrongToken}`)
  .expect(401)
  .expect('Content-Type', /json/)
  .end((err, res) => {
    t.truthy(err, 'Should return an error')
    t.end()
  })
})

test.serial.cb('/api/metrics/:uuid', t => {
  request(server)
  .get(`/api/metrics/${agentUuid}`)
  .set('Authorization', `Bearer ${token}`)  
  .expect(200)
  .expect('Content-type', /json/)
  .end((err, res) => {
    t.falsy(err, 'should not return an error')
    let body = JSON.stringify(res.body)
    let expected = JSON.stringify(metricsFixtures.findByAgentUuid(agentUuid))
    t.deepEqual(body, expected, 'result should be the expected')
    t.end()
  })
})

test.serial.cb('/api/metrics/:uuid - not found', t => {
  request(server)
  .get(`/api/metrics/${wrongAgentUuid}`)
  .set('Authorization', `Bearer ${token}`)
  .expect(404)
  .expect('Content-type', /json/)
  .end((err, res) => {
    if (err) {
      console.log(err)
    }
    t.truthy(res.body.error, 'should be return an error')
    t.regex(res.body.error, /not found/, 'should found an not found error')
    t.end()
  })
})

test.serial.cb('/api/metrics/:uuid - wrong JWT', t => {
  request(server)
  .get(`/api/metrics/${agentUuid}`)
  .set('Authorization', `Bearer ${wrongToken}`)
  .expect(401)
  .expect('Content-Type', /json/)
  .end((err, res) => {
    t.truthy(err, 'Should return an error')
    t.end()
  })
})

test.serial.cb('/api/metrics/:uuid/:type', t => {
  request(server)
  .get(`/api/metrics/${agentUuid}/${typeMetric}`)
  .set('Authorization', `Bearer ${token}`)
  .expect(200)
  .expect('Content-type', /json/)
  .end((err, res) => {
    t.falsy(err, 'should not return an error')
    let body = JSON.stringify(res.body)
    let expected = JSON.stringify(metricsFixtures.findByTypeAgentUuid(agentUuid, typeMetric))
    t.deepEqual(body, expected, 'response should be the expected')
    t.end()
  })
})

test.serial.cb('/api/metrics/:uuid/:type - not found', t => {
  request(server)
  .get(`/api/metrics/${wrongAgentUuid}/${typeMetric}`)
  .set('Authorization', `Bearer ${token}`)
  .expect(404)
  .expect('Content-type', /json/)
  .end((err, res) => {
    if (err) {
      console.log(err)
    }
    t.truthy(res.body.error, 'should be return an error')
    t.regex(res.body.error, /not found/, 'should contain an not found error')
    t.end()
  })
})

test.serial.cb('/api/metrics/:uuid/:type - wrong JWT', t => {
  request(server)
  .get(`/api/metrics/${agentUuid}/${typeMetric}`)
  .set('Authorization', `Bearer ${wrongToken}`)
  .expect(401)
  .expect('Content-Type', /json/)
  .end((err, res) => {
    t.truthy(err, 'Should return an error')
    t.end()
  })
})
