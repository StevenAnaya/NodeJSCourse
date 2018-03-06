'use strict'
// Exportamos la funcion que nos recibira un modelo de metrica y ademas informacion acerca del agente
module.exports = function setupMetric (MetricModel, AgentModel) {
  // Aca hacemos un JOIN con sequelize, le especificamos por que camppos queremos filtrar o queremos recibir,
  // en este caso solo queremos el tipo de metrica, ademas para que no nos retorne un moton de metricas le decimos
  // que nos lo agrupe en solo 3 campos y que nos muestre la cantidad que hay, luego le decimos que no incluya campos de
  // la tabla de Agente y que el modelo al que tiene que hacer join sea al del Agente, por ultimo que nos pase el resultado
  // en JSON
  async function findByAgentUuid (uuid) {
    return MetricModel.findAll({
      attributes: [ 'type' ],
      group: [ 'type' ],
      include: [{
        attributes: [],
        model: AgentModel,
        where: {
          uuid
        }
      }],
      raw: true
    })
  }
  // Aqui buscamos por el tipo y segun el uuid que tenga el agente, repetimos el mismo procedimiento y lo unico diferente es que
  // le agregamos un limite de datos que nos va a retornar, tambien le decimos que nos lo organice por el dato de creacion
  // y en forma descendente.
  async function findByTypeAgentUuid (uuid, type) {
    return MetricModel.findAll({
      attributes: [ 'id', 'type', 'value', 'createdAt' ],
      where: {
        type
      },
      limit: 20,
      order: [[ 'createdAt', 'DESC' ]],
      include: [{
        attributes: [],
        model: AgentModel,
        where: {
          uuid
        }
      }],
      raw: true
    })
  }

  // Creamos una funcion que nos permita saber si el uuid del agente que recibimos existe o no existe.
  async function create (uuid, metric) {
    const agent = await AgentModel.findOne({
      where: {
        uuid
      }
    })
    // Aqui verificamos si el agente existe, si existe este, le vamos a asignar el id del agente
    // a la metrica que vamos a crear
    if (agent) {
      Object.assign(metric, { agentId: agent.id })
      const result = await MetricModel.create(metric)
      return result.toJSON()
    }
  }

  return {
    create,
    findByAgentUuid,
    findByTypeAgentUuid
  }
}
