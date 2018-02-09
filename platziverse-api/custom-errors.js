'use strict'

class AgentNotFound extends Error {
  constructor (givenUuid) {
    super(givenUuid)

    this.code = 404
    this.nameError = 'AgentNotFoundERROR' 

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AgentNotFound)
    }

    this.message = `Agent with ${givenUuid} not found`
  }
}

class MetricsNotFound extends Error {
  constructor (givenUuid, type) {
    super(givenUuid, type)

    this.code = 404
    this.nameError = 'MetricNotFoundERROR'
    this.givenUuid = givenUuid
    this.type = type

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MetricsNotFound)
    }

    this.message = (type) ? `Agent metric's with uuid ${givenUuid} and type ${type} not founds` : `Agent metric's with uuid ${givenUuid} not founds`
  }
}

class NoAuthenticated extends Error {
  constructor (givenUuid, ...params) {
    super(givenUuid, ...params)

    this.code = 401
    this.givenUuid = givenUuid
    this.nameError = 'AuthenticatedERROR'
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NoAuthenticated)
    }

    this.message = `This user need to be authenticated to consume the content required`
  }
}

class NoAuthorized extends Error {
  constructor (...params) {
    super(...params)

    this.code = 403
    this.nameError = 'NoAuthorizedERROR'

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NoAuthorized)
    }

    this.message = `This user is not authorized to access the required content`
  }
}

module.exports = { AgentNotFound, MetricsNotFound, NoAuthenticated, NoAuthorized }
