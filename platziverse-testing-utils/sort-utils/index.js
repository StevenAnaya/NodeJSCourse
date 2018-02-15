'use strict'

function extend (obj, value) {
  const clone = Object.assign({}, obj)
  return Object.assign(clone, value)
}

function sortBy (property) {
  return (a, b) => {
    let aProp = a[property]
    let bProp = b[property]

    if (aProp < bProp) {
      return -1
    } else if (aProp > bProp) {
      return 1
    } else {
      return 0
    }
  }
}

module.exports = {
  extend,
  sortBy
}
