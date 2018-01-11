'use strict'

module.exports = function setupAgent (AgentModel) {
  // Metodo para buscar por nombre de usuario y que ademas este conectado
  function findByUsername (username) {
    return AgentModel.findAll({
      where: {
        username,
        connected: true
      }
    })
  }
  // Metodo para buscar todos los agentes que esten conectados
  function findConnected () {
    return AgentModel.findAll({
      where: {
        connected: true
      }
    })
  }
  // Metodo para buscar todos los agentes
  function findAll () {
    return AgentModel.findAll()
  }
  // Metodo para buscar un agente por su id publico
  function findByUuid (uuid) {
    return AgentModel.findOne({
      where: {
        uuid
      }
    })
  }
  // Aca lo que vamos a hacer es un estilo de wrapper para que el usuario que use nuestro modulo
  // no vea de donde viene el AgentModel. PAra eso lo que vamos a hacer es que con el modelo de
  // agente que recibimos lo vamos a retornar con la funcion que vamos a querer usar
  function findById (id) {
    return AgentModel.findById(id)
  }
  // Esta funcion es para saber si el agente existe y asi actualizarlo, de lo contrario tendria que crearlo,
  // en este caso sequelize no tiene algun metodo para hacer esto, asi que vamos a tener que hacerlo de
  // forma manual.
  async function createOrUpdate (agent) {
    // Esto es un objeto de sequelize, este es un query donde le decimos que seleccione de X tabla el campo que
    // tenga el uuid igual al del agente
    const cond = {
      where: {
        uuid: agent.uuid
      }
    }
    // Aca resolvemos promesa y usamos un metodo del modelo llamado findOne(cond) que nos va a permitir traer solo el
    // primer dato que haga match con el query que nosotros le pasamos
    const existingAgent = await AgentModel.findOne(cond)
    // Si el agente existe, o sea si nos retorna un valor distinto a 0 o false entrara y nos actualizara el agente con los
    // campos que nosotros queramos actualizarle, y este es actualizado que nos retorne el Agente con actualizado, de lo
    // contrario que nos retorne el Agente existente.
    if (existingAgent) {
      const updated = await AgentModel.update(agent, cond)
      return updated ? AgentModel.findOne(cond) : existingAgent
    }
    // Luego si este no existe lo que hacemos es crear el agente y decirle a sequelize que nos retorne la respuesta en un
    // JSON
    const result = await AgentModel.create(agent)
    return result.toJSON()
  }

  return {
    findById,
    createOrUpdate,
    findAll,
    findByUsername,
    findConnected,
    findByUuid
  }
}
