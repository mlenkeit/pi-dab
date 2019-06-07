/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
'use strict'

const async = require('async')
const crypto = require('crypto')
const dotenv = require('dotenv')
const exec = require('child_process').exec
const expect = require('chai').expect
const kill = require('tree-kill')
const path = require('path')
const request = require('request')
const rp = require('request-promise-native')
const tmp = require('tmp')

const getPortFromCompose = () => require('./../../lib/exec')('docker-compose exec -T main bash -c "echo \\$PORT"', {
  cwd: path.resolve(__dirname, './../..')
}).then(stdio => parseInt(stdio.stdout.trim(), 10))

const startPiDabUntilTunnelOpened = function ({ env }) {
  return new Promise((resolve, reject) => {
    const cp = exec('docker-compose up --build --force-recreate', {
      cwd: path.resolve(__dirname, './../..'),
      env: env
    })
    cp.stdout.on('data', function (data) {
      console.log(data)
      if (/generated secret/i.test(data.toString())) {
        const matches = /(.{8}-.{4}-.{4}-.{4}-.{12})/.exec(data.toString())
        if (matches) {
          cp.secret = matches[0]
        }
      }
      if (/opened/i.test(data.toString())) {
        resolve(cp)
      }
    })
    // cp.stderr.on('data', reject)
  })
}
const wait = timeout => new Promise(resolve => setTimeout(resolve, timeout))

const retry = (tries, fn, delay, tryCounter = 0) => fn()
  .catch((/* err */) =>
    tries > tryCounter
      ? wait(delay).then(() => retry(tries, fn, delay, tryCounter + 1))
      : Promise.reject(new Error(`Operation failed after re-trying ${tries} times`)))

const post = function (secret, port) {
  const payload = {
    'id': 1234,
    'sha': '4c0e337555e64622e752f6ca51d79041ffc7f37d',
    'name': 'mlenkeit/pi-dab',
    'context': 'continuous-integration/travis-ci/push',
    'state': 'success',
    'branches': [{
      'name': 'master'
    }]
  }
  const payloadSignature = 'sha1=' + crypto.createHmac('sha1', secret).update(JSON.stringify(payload)).digest('hex')

  return new Promise((resolve, reject) => {
    request.post({
      url: `http://localhost:${port}`,
      json: payload,
      headers: {
        'X-Hub-Signature': payloadSignature
      }
    }, (err, response, body) => {
      if (err) return reject(err)
      console.log(response.statusCode, body)
      resolve()
    })
  })
}

describe('System Test', function () {
  // before(function() {
  //   check.assert.nonEmptyString(process.env.GITHUB_USER, 'env var GITHUB_USER empty')
  //   check.assert.nonEmptyString(process.env.GITHUB_TOKEN, 'env var GITHUB_TOKEN empty')
  // })

  beforeEach(function () {
    this.cps = []

    dotenv.config({ path: path.resolve(__dirname, './../../.env.test') })
    this.env = Object.assign({}, process.env)
    this.env.PROJECTS = path.resolve(__dirname, './../fixture/projects2.js')
    this.env.PROJECTS_ROOT_DIR = tmp.dirSync().name
  })

  afterEach(function (done) {
    async.each(this.cps, function (cp, cb) {
      var pid = cp.pid
      kill(pid, 'SIGKILL', function (/* err */) {
        cb()
      })
    }, done)
  })

  it('test', function () {
    return startPiDabUntilTunnelOpened({ env: this.env })
      .then(cp => {
        this.cps.push(cp)
        console.log('test: compose started')
        const timeout = 5000
        console.log(`test: waiting for ${timeout} ms`)
        return wait(timeout)
          .then(() => getPortFromCompose())
          .then(port => {
            console.log(`test: found exposed port ${port}`)

            return rp.get({
              uri: `http://localhost:${port}/hello`,
              simple: false,
              resolveWithFullResponse: true
            }).then(response => {
              console.log('status code', response.statusCode)
              expect(response.statusCode).to.equal(404)
            }).then(() => post(cp.secret, port))
              .then(() => {
                const timeout = 30000
                console.log(`test: waiting for ${timeout} ms`)
                return wait(timeout)
              })
              .then(() => {
                return rp.get({
                  uri: `http://localhost:${port}/hello`,
                  simple: false,
                  resolveWithFullResponse: true
                }).then(response => {
                  console.log('status code', response.statusCode)
                  expect(response.statusCode).to.equal(200)
                })
              })
          })
      })
  })
})
