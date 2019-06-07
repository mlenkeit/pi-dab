'use strict'

const EventEmitter = require('events')
const sinon = require('sinon')

module.exports = sinon.spy(function () {
  const tunnel = new EventEmitter()
  tunnel.url = 'http://localhost.localtunnel'
  tunnel.close = sinon.spy()

  const mock = sinon.spy((port, cb) => {
    cb(mock.err, tunnel)
    return tunnel
  })

  mock.tunnel = tunnel
  mock.err = null

  return mock
})
