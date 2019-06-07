/* eslint-env mocha */
'use strict'

const chai = require('chai')
const expect = require('chai').expect
const sinon = require('sinon')

chai.use(require('sinon-chai'))

describe('open-tunnel', function () {
  beforeEach(function () {
    this.onOpen = sinon.spy()
    this.localtunnel = require('./../mock/localtunnel')()
    this.port = 54321
  })

  context('when opening the tunnnel succeeds', function () {
    beforeEach(function () {
      this.openTunnel = require('./../../lib/open-tunnel')({
        cb: this.onOpen,
        port: this.port,
        localtunnel: this.localtunnel
      })
    })

    it('opens a localtunnel tunnel on the given port', function () {
      expect(this.localtunnel).to.be.calledWith(this.port, sinon.match.func)
    })

    it('invokes the callback with the url', function () {
      expect(this.onOpen).to.be.calledWith(this.localtunnel.tunnel.url)
    })

    context('when error event is emitted', function () {
      beforeEach(function () {
        this.localtunnel.reset()
        this.onOpen.reset()
        this.localtunnel.tunnel.emit('error', new Error())
      })

      it('opens a new tunnel on the given port', function () {
        expect(this.localtunnel).to.be.calledWith(this.port, sinon.match.func)
      })

      it('invokes the callback with the url', function () {
        expect(this.onOpen).to.be.calledWith(this.localtunnel.tunnel.url)
      })

      it('closes the potentially open tunnel', function () {
        expect(this.localtunnel.tunnel.close).to.have.callCount(1)
      })
    })

    context('when close event is emitted', function () {
      beforeEach(function () {
        this.localtunnel.reset()
        this.onOpen.reset()
        this.localtunnel.tunnel.emit('close')
      })

      it('opens a new tunnel on the given port', function () {
        expect(this.localtunnel).to.be.calledWith(this.port, sinon.match.func)
      })

      it('invokes the callback with the url', function () {
        expect(this.onOpen).to.be.calledWith(this.localtunnel.tunnel.url)
      })
    })
  })

  context('when opening a tunnel fails', function () {
    beforeEach(function () {
      sinon.stub(process, 'exit')

      this.localtunnel.err = new Error()

      this.openTunnel = require('./../../lib/open-tunnel')({
        cb: this.onOpen,
        port: this.port,
        localtunnel: this.localtunnel
      })
    })

    afterEach(function () {
      process.exit.restore()
    })

    it('exits the process with 1', function () {
      expect(process.exit).to.be.calledWith(1)
    })
  })
})
