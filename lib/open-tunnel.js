'use strict'

const check = require('check-types')
const winston = require('winston')

module.exports = function (config) {
  check.assert.function(config.cb, 'config.cb must be of type function')
  check.assert.function(config.localtunnel, 'config.localtunnel must be of type function')
  check.assert.number(config.port, 'config.port must be of type number')

  const openTunnel = () => {
    winston.log('info', `Opening tunnel to port ${config.port}...`)
    const tunnel = config.localtunnel(config.port, (err, tunnel) => {
      if (err) {
        winston.log('error', `Failed to open port: ${err}`)
        return process.exit(1)
      }
      winston.log('info', `Port ${config.port} opened via ${tunnel.url}.`)
      config.cb(tunnel.url)
    })

    tunnel.on('close', () => {
      winston.log('warn', `Tunnel to port ${config.port} closed`)
      openTunnel()
    })
    tunnel.on('error', err => {
      winston.log('warn', `Error on tunnel to port ${config.port}: ${err}`)
      try {
        tunnel.close()
      } finally {
        openTunnel()
      }
    })
  }

  openTunnel()
}
