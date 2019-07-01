'use strict'

const check = require('check-types')
const localtunnel = require('ws-localtunnel-client')

module.exports = function (config) {
  check.assert.string(config.apiToken, 'config.apiToken must be a string')
  check.assert.string(config.localtunnelOrigin, 'config.localtunnelOrigin must be a string')
  check.assert.string(config.localtunnelWebhookUrl, 'config.localtunnelWebhookUrl must be a string')
  check.assert.function(config.cb, 'config.cb must be of type function')
  check.assert.number(config.port, 'config.port must be of type number')

  const logger = config.logger || require('./logger')()

  const openTunnel = () => {
    logger.log('info', `Opening tunnel via ws-localtunnel to port ${config.port}...`)

    const opts = {
      apiToken: config.apiToken,
      ltOrigin: config.localtunnelOrigin,
      destinationOrigin: `http://localhost:${config.port}`,
      realm: 'pi-dab',
      onError: () => process.exit(1)
    }
    localtunnel(opts)
      .on('connectFailed', err => {
        logger.log('error', `Failed to open port: ${err}`)
        return process.exit(1)
      })
      .on('connect', connection => {
        const url = config.localtunnelWebhookUrl
        logger.log('info', `Port ${config.port} opened via ${url}.`)
        config.cb(url)
        connection.on('error', err => {
          logger.log('warn', `Error on tunnel to port ${config.port}: ${err}`)
          openTunnel()
        })
      })
  }

  openTunnel()
}
