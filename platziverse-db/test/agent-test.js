'use strict'

const test = require('ava')

let db = null
// Vamos a crear la configuracion para que no tengamos que probar sobre la base de datos real
let config = {
  logging: function () {}
}
// Vamos a hacer uso de los Hooks que nos entrega AVA, con esto podemos hacer que una funcion
// se ejecute siempre, antes o despues de un test.
test.beforeEach(async () => {
  const setupDatabase = require('../')
  db = await setupDatabase(config)
})

test('Agent', t => {
  t.truthy(db.Agent, 'Agent service should exist')
})
