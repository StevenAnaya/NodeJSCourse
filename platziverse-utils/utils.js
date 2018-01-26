'use strict'

function parsePayload (payload) {
  // Usamos instanceof para verificar que es un buffer, si es asi lo convertimos a string con le formato utf8.
  if (payload instanceof Buffer) {
    payload = payload.toString('utf8')
  }
  // Si lo que nos llega es un objeto que no es buuffer ni JSON lo que hacemos es usar JSON.parse para convertirlo
  // y como buena practica siempre debemos capturar el error a usar JSON ya que nos pueden pasar estructuras mal
  // formadas entonces mejor capturar los errores
  try {
    payload = JSON.parse(payload)
  } catch (e) {
    payload = null
  }

  return payload
}

module.exports = {
  parsePayload
}
