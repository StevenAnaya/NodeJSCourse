require('longjohn')
setTimeout(() => {
  throw new Error('Tenga pa que se entretenga')
}, 4000)