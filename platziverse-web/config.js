'use strict'

module.exports = {
  endpoint: process.env.API_ENDPOINT || 'http://localhost:3000',
  serverHost: process.env.SERVER_HOST || 'http://localhost',
  mqttHost: process.env.MQTT_HOST || 'mqtt://localhost',
  apiToken: process.env.API_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InBsYXR6aSIsImFkbWluIjp0cnVlLCJwZXJtaXNzaW9ucyI6WyJtZXRyaWNzOnJlYWQiXSwiaWF0IjoxNTE5MTU3NzU3fQ.LZ8RRxZppf4c-PLQTIvf8sLksG_8vWtL1HpWBm5-dec'
}
