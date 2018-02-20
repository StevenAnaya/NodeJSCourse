'use strict'
// Esta funcion nos servira para poder distribuir los mensajes que nos lleguen del 
// agente al socket sin tener que estar agregando los listeners a cada rato
// -------
// Recibimos un mensaje fuente y un destino para cada mensaje
function pipe (source, target) {
  // Validamos que si el source o el target no tienen un emit debera retornar error ya que 
  // solo funcionara con EventEmitter
  if (!source.emit || !target.emit) {
    throw TypeError(`Please pass EventEmitter's as an argument`)
  }
  // Aca lo que hacemos es sacar una referencia de la funcion primeroa "source.emit" y la guardamos 
  // en una constante dentro de "source._emit" y luego la sacamos como un scope global dentro de esta 
  // funcion con "emit"
  const emit = source._emit = source.emit
  // Aca vamos a sobreescribir la funcion de emit de la fuente. Aqui le decimos que aplique los argumentos que 
  // le estan pasando a la fuente. De esta forma emitimos la fuente.
  // Y estos eventos que emitimos se los pasamos al target (a al lugar que deben llegar) y tambien le aplicamos los 
  // argumentos que nos lleguen con apply y retornamos el source como funcionan los EventEmitter
  source.emit = function () {
    emit.apply(source, arguments)
    target.emit.apply(target, arguments)
    return source
  }
}

module.exports = {
  pipe
}
