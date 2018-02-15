'use strict'

const agent = {
  id: 1,
  uuid: 'yyy-yyy-yyy',
  name: 'fixture',
  username: 'platzi',
  hostname: 'test-host',
  pid: 0,
  connected: true,
  createdAt: new Date(),
  updatedAt: new Date()
}

const agents = [
  agent,
  // Aca lo que hacemos es pasarle el objeto que vamos a clonar y luego le pasamos los valores que queremos cambiar
  extend(agent, { id: 2, uuid: 'yyy-yyy-yyw', connected: false, username: 'test' }),
  extend(agent, { id: 3, uuid: 'yyy-yyy-yyz' }),
  extend(agent, { id: 4, uuid: 'yyy-yyy-yyx', username: 'test' })
]

function extend (obj, values) {
  // Aca hacemos uso de la propiedad de los objetos de JS assign() que nos permite recibir un objeto y clonarlo,
  // luego si queremos con el mismo metodo podemos asignarle valores que queramos cambiar a ese objeto
  const clone = Object.assign({}, obj)
  return Object.assign(clone, values)
}

module.exports = {
  // En este modulo lo que hacemos es retornar un objeto, un array con objetos o hacer filtros de los datos que
  // queremos usar haciendo uso de las propiedades que tienen los array para filtrar y para devolver el primer
  // dato que encuentre en el filtro
  single: agent,
  all: agents,
  connected: agents.filter(a => a.connected),
  platzi: agents.filter(a => a.username === 'platzi'),
  byUuid: id => agents.filter(a => a.uuid === id).shift(),
  byId: id => agents.filter(a => a.id === id).shift()
}
