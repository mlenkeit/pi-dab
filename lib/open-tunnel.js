'use strict'

const check = require('check-types')

module.exports = function (config) {
  check.assert.function(config.cb, 'config.cb must be of type function')
  check.assert.function(config.localtunnel, 'config.localtunnel must be of type function')
  check.assert.number(config.port, 'config.port must be of type number')

  const logger = config.logger || require('./logger')()

  const openTunnel = () => {
    logger.log('info', `Opening tunnel via localtunnel to port ${config.port}...`)
    const tunnel = config.localtunnel(config.port, (err, tunnel) => {
      if (err) {
        logger.log('error', `Failed to open port: ${err}`)
        return process.exit(1)
      }
      logger.log('info', `Port ${config.port} opened via ${tunnel.url}.`)
      config.cb(tunnel.url)
    })

    tunnel.on('close', () => {
      logger.log('warn', `Tunnel to port ${config.port} closed`)
      openTunnel()
    })
    tunnel.on('error', err => {
      logger.log('warn', `Error on tunnel to port ${config.port}: ${err}`)
      try {
        tunnel.close()
      } finally {
        openTunnel()
      }
    })
  }

  openTunnel()
}
