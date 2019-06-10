'use strict'

module.exports = timeout => {
  console.log(`test: waiting for ${timeout} ms...`)
  return new Promise(resolve => setTimeout(() => {
    console.log(`test: waited for ${timeout} ms`)
    resolve()
  }, timeout))
}
