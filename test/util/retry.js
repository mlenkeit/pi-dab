'use strict'

const wait = require('./wait')

const retry = module.exports = (tries, fn, delay, tryCounter = 0) => fn()
  .catch((/* err */) =>
    tries > tryCounter
      ? wait(delay).then(() => retry(tries, fn, delay, tryCounter + 1))
      : Promise.reject(new Error(`Operation failed after re-trying ${tries} times`)))
