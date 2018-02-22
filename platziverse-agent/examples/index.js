'use strict'

const PlatziverseAgent = require('../')

const agent = new PlatziverseAgent({
  interval: 2000,
  name: 'myapp',
  username: 'admin'
})

agent.addMetric('promiseMetric', function getRss () {
  return process.memoryUsage().rss
})

agent.addMetric('promiseMetric', function getRandomPromise () {
  return Promise.resolve(Math.random())
})

agent.addMetric('callbackMetric', function getRandomCallback (callback) {
  setTimeout(() => {
    callback(null, Math.random())
  }, 2000)
})

agent.connect()

// This agent only 
agent.on('connected', handler)
agent.on('disconnected', handler)
agent.on('message', handler)
// Other Agents
agent.on('agent/connected', handler)
agent.on('agent/disconnected', handler)
agent.on('agent/message', handler)

function handler (payload) {
  console.log(payload)
}
