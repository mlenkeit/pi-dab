'use strict'

const check = require('check-types')
const ngrok = require('ngrok')

module.exports = function (config) {
  check.assert.nonEmptyString(config.authToken, 'config.authToken must be of type string')
  check.assert.function(config.cb, 'config.cb must be of type function')
  check.assert.number(config.port, 'config.port must be of type number')

  const logger = config.logger || require('./logger')()

  const openTunnel = () => {
    logger.log('info', `Opening tunnel to port ${config.port}...`)

    ngrok.connect({
      proto: 'http',
      addr: config.port,
      // auth: 'user:pwd',
      authtoken: config.authToken
    }).then(url => {
      logger.log('info', `Port ${config.port} opened via ${url}.`)
      config.cb(url)
    }).catch(err => {
      logger.log('error', `Failed to open port: ${err}`)
      return process.exit(1)
    })
  }

  openTunnel()
}
