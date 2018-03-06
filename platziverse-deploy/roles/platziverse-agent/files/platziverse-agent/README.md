# platziverse-agent

## Usage

``` js
const PlatziverseAgent = require('platiziverse-agent')

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

agent.on('agent/connected')
agent.on('agent/disconnected')
agent.on('agent/message', payload => {
  console.log(payload)
})

setTimeout(() => agent.disconnect(), 20000)
```