'use strict'
// Aca hacemos un namespace para decirle que vamos a hacer debug en la carpeta y el archivo actual nomas
const debug = require('debug')('platziverse:db:setup')
const inquirer = require('inquirer')
const chalk = require('chalk')
const db = require('./')
const config = require('./config-db')
// Creamos la instancioa del prompt para poder mostrar los mensajes por la pantalla
const prompt = inquirer.createPromptModule()
let autConfig = false

process.argv.find((arg) => {
  if (arg === '-y' || arg === '-yes') {
    autConfig = true
  }
})

async function setup () {
  // const config = configSetup()

  if (!autConfig) {
    // Ahora a la funcion prompt que instanciamos le pasamos por parametro la configuracion que le queremo
    // dar a esta confirmacion.
    const answer = await prompt([
      {
        type: 'confirm',
        name: 'setup',
        message: 'This will destroy your database, are you sure?'
      }
    ])
    // Aqui evaluamos la respuesta, si es falsa que no ejecute el resto del script, de lo contrario qu
    // el seteo de esta base de datos de nuevo
    if (!answer.setup) return console.log('Nothing happened :)')

    await db(config).catch(handleFatalError)
    console.log('Database configured')
    process.exit(0)
  }

  await db(config).catch(handleFatalError)
  console.log('Database configured')
  process.exit(0)
}

// En esta funcion capturamos el error y imprimimos el stack y luego matamos el proceso con codigo 1
function handleFatalError (err) {
  // Aca usamos chalk para que el error que imprimos no lo muestre con un color rojo y se pueda
  // distinguir bien
  console.error(`${chalk.red('[faltal error]')} ${err.message}`)
  console.error(err.stack)
  process.exit(1)
}
setup()
