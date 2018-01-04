'use strict'
// Aca hacemos un namespace para decirle que vamos a hacer debug en la carpeta y el archivo actual nomas
const debug = require('debug')('platziverse:db:setup')
const inquirer = require('inquirer')
const chalk = require('chalk')
const db = require('./')
// Creamos la instancioa del prompt para poder mostrar los mensajes por la pantalla
const prompt = inquirer.createPromptModule()

async function setup () {
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

  const config = {
    database: process.env.DB_NAME || 'platziverse',
    username: process.env.DB_USER || 'steven',
    password: process.env.DB_PASS || 'zanahoria19',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    // Este atributo sirve para mostrar mensaje de logs, este recibe una funcion, en este caso usamos el
    // modulo de debug
    logging: s => debug(s),
    // Esta linea es para corregir el error que nos arroja cuando corremos el script de setup
    operatorsAliases: false,
    // Esta propiedad de setup la vamos a usar para que cuando este en true este borre la base de dato
    // y cree una nueva. Hay que tener cuidado con este
    setup: true
  }
  // Vamos a capturar los errores que ocurran en la configuracion de nuestra base de datos
  await db(config).catch(handleFatalError)

  console.log('Success')
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

// Aca ejecutamos de una vez la funcion cuando arranque
setup()
