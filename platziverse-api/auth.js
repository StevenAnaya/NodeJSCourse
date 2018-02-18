'use strict'
// Este es el modulo puro de JWT desarrollado por Auth0 para Node.
const jwt = require('jsonwebtoken')
// Esta funcion es la que hace la firma del token, le pasamos el payload, la llave secreta y el 
// callback que queremos ejecutar.
function sign (payload, secret, callback) {
  jwt.sign(payload, secret, callback)
}
// Con esta verificamos el token que nos llegue, necesitamos el token, la llave secreta y el callback
function verify (token, secret, callback) {
  jwt.verify(token, secret, callback)
}

module.exports = {
  sign,
  verify
}
