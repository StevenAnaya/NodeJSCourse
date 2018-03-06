'use strict'

const test = require('ava')
const sinon = require('sinon')
const proxy = require('proxyquire')
const metricFixtures = require('../../platziverse-testing-utils/fixtures/metric')
const agentFixtures = require('../../platziverse-testing-utils/fixtures/agent')

let config = {
  logging: function () {}
}

let uuid = 'yyy-yyy-yyy'
let type = 'CPU'
let MetricStub = null
let AgentStub = null
let db = null
let sandbox = null

let uuidArgs = {
  where: { uuid }
}

let metricUuidArgs = {
  attributes: [ 'type' ],
  group: [ 'type' ],
  include: [{
    attributes: [],
    model: AgentStub,
    where: {
      uuid
    }
  }],
  raw: true
}

let typeUuidArgs = {
  attributes: [ 'id', 'type', 'value', 'createdAt' ],
  where: {
    type
  },
  limit: 20,
  order: [[ 'createdAt', 'DESC' ]],
  include: [{
    attributes: [],
    model: AgentStub,
    where: {
      uuid
    }
  }],
  raw: true
}

let newMetric = {
  agentId: 1,
  type: 'CPU',
  value: '18%'
}

test.beforeEach(async () => {
  sandbox = sinon.sandbox.create()

  MetricStub = {
    belongsTo: sinon.spy()
  }

  AgentStub = {
    hasMany: sinon.spy()
  }

  // Model create stub
  AgentStub.findOne = sandbox.stub()
  AgentStub.findOne.withArgs(uuidArgs).returns(Promise.resolve(agentFixtures.byUuid(uuid)))

  MetricStub.create = sandbox.stub()
  MetricStub.create.withArgs(newMetric).returns(Promise.resolve({
    toJSON () { return newMetric }
  }))

  metricUuidArgs.include[0].model = AgentStub
  typeUuidArgs.include[0].model = AgentStub

  MetricStub.findAll = sandbox.stub()
  MetricStub.findAll.withArgs().returns(Promise.resolve(metricFixtures.all))
  MetricStub.findAll.withArgs(metricUuidArgs).returns(Promise.resolve(metricFixtures.findByAgentUuid(uuid)))
  MetricStub.findAll.withArgs(typeUuidArgs).returns(Promise.resolve(metricFixtures.findByTypeAgentUuid(type, uuid)))

  const setupDatabase = proxy('../', {
    './models/agent': () => AgentStub,
    './models/metric': () => MetricStub
  })

  db = await setupDatabase(config)
})

test.afterEach(() => {
  sandbox && sinon.sandbox.restore()
})

test('Metric', t => {
  t.truthy(db.Metric, 'Metric service should exist')
})

test.serial('setup metric', t => {
  t.true(AgentStub.hasMany.called, 'hasMany was executed')
  t.true(AgentStub.hasMany.calledWith(MetricStub), 'argument should be the metricModel')
  t.true(MetricStub.belongsTo.called, 'MetricModel was exectuded')
  t.true(MetricStub.belongsTo.calledWith(AgentStub), 'Argument should be the AgentModel')
})

test.serial('Metric#findByAgentUuid', async t => {
  let metric = await db.Metric.findByAgentUuid(uuid)

  t.true(MetricStub.findAll.called, 'findAll should be called on model')
  t.true(MetricStub.findAll.calledOnce, 'findAll should be called once')
  // t.true(MetricStub.findAll.calledWith(metricUuidArgs), 'findAll should be called with specified metricUuidArgs')

  t.deepEqual(metric, metricFixtures.findByAgentUuid(uuid), 'should be the same')
})

test.serial('Metric#findByTypeAgentUuid', async t => {
  let metric = await db.Metric.findByTypeAgentUuid(type, uuid)

  t.true(MetricStub.findAll.called, 'findAll should be called on model')
  t.true(MetricStub.findAll.calledOnce, 'findAll should be called once')
  // t.true(MetricStub.findAll.calledWith(typeUuidArgs), 'findAll should be called with specified typeUuidArgs')

  t.deepEqual(metric, metricFixtures.findByTypeAgentUuid(type, uuid), 'should be the same')
})

test.serial('Metric#create', async t => {
  let metric = await db.Metric.create(uuid, newMetric)

  t.true(AgentStub.findOne.called, 'Agent findOne should be called on model')
  t.true(AgentStub.findOne.calledOnce, 'Agent findOne should be called once')
  t.true(AgentStub.findOne.calledWith(uuidArgs), 'findOne should be called with uuid args')

  t.true(MetricStub.create.called, 'create should be called on model')
  t.true(MetricStub.create.calledOnce, 'create should be called once')
  t.true(MetricStub.create.calledWith(newMetric), 'create should be called with specified args')

  t.deepEqual(metric, newMetric, 'agent should be the same')
})
