'use strict'

const test = require('ava')
// Esto es como una herramienta que permite hacer peticiones HTTP con aserciciones
const request = require('supertest')

const server = require('../server')

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
    .expect(200)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.falsy(err, 'should not return an error')
      let body = res.body
      t.deepEqual(body, {}, 'response should be the expected')
      t.end()
    })
})
