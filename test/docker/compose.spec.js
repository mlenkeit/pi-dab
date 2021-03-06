/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
'use strict'

const async = require('async')
const check = require('check-types')
const expect = require('chai').expect
const kill = require('tree-kill')
const path = require('path')
const rp = require('request-promise-native')

const exec = require('./../../lib/exec')

const payloadBuilder = require('./../util/github-webhook-payload-builder')
const retry = require('./../util/retry')
const wait = require('./../util/wait')
const webhookSimulator = require('./../util/github-webhook-simulator')

const PI_DAB_ROOT_DIR = path.resolve(__dirname, './../..')

const getPortFromCompose = () => exec('docker-compose exec -T main bash -c "echo \\$PORT"', {
  cwd: PI_DAB_ROOT_DIR
}).then(stdio => parseInt(stdio.stdout.trim(), 10))

const removeDockerComposeContainers = () => {
  console.log('test: removing compose containers...')
  return retry(5, () => exec('docker-compose down', {
    cwd: PI_DAB_ROOT_DIR
  }), 1000)
    .then(() => console.log('test: removed compose containers'))
    .catch(err => console.error(`test: failed to remove compose containers, continuing anyway: ${err}`))
}

const startPiDabUntilTunnelOpened = function ({ env }) {
  const exec = require('child_process').exec
  const state = { piDabStarted: false, launcherStarted: false, resolved: false }
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
        state.piDabStarted = true
        console.log('test: pi-dab started')
      }
      if (/Started pi-dab-launcher/.test(data.toString())) {
        state.launcherStarted = true
        console.log('test: pi-dab-launcher started')
      }
      if (state.piDabStarted && state.launcherStarted && !state.resolved) {
        console.log('test: compose ready')
        state.resolved = true
        resolve(cp)
      }
    })
    // cp.stderr.on('data', reject)
  })
}

const simulateStatusUpdateFromTravisForPiDabToHelloWorld = ({ secret, port }) => webhookSimulator({ port })
  .send(payloadBuilder()
    .contextTravisPush()
    .sha(process.env.PI_DAB_HELLO_WORLD_COMMIT_ID)
    .repo('mlenkeit/pi-dab')
    .build({ secret }))

const sendGetRequestToHelloEndpoint = port => rp.get({
  uri: `http://localhost:${port}/hello`,
  simple: false,
  resolveWithFullResponse: true
}).then(response => {
  console.log(`test: GET request to hello endpoint returned status code ${response.statusCode}`)
  return response
})

describe('Docker Compose Test', function () {
  beforeEach(function () {
    const { PI_DAB_HELLO_WORLD_COMMIT_ID } = process.env
    check.assert.nonEmptyString(PI_DAB_HELLO_WORLD_COMMIT_ID, 'env var PI_DAB_HELLO_WORLD_COMMIT_ID empty')

    this.cps = []
    this.env = Object.assign({}, process.env)
  })

  beforeEach('remove compose containers before execution', function () {
    return removeDockerComposeContainers()
  })

  afterEach(function (done) {
    async.each(this.cps, function (cp, cb) {
      var pid = cp.pid
      kill(pid, 'SIGKILL', function (/* err */) {
        cb()
      })
    }, done)
  })

  afterEach('remove compose containers after execution', function () {
    return removeDockerComposeContainers()
  })

  it('auto-updates itself', function () {
    return startPiDabUntilTunnelOpened({ env: this.env })
      .then(cp => {
        this.cps.push(cp)
        return wait(5000)
          .then(() => getPortFromCompose())
          .then(port => {
            console.log(`test: found exposed port ${port}`)

            return sendGetRequestToHelloEndpoint(port)
              .then(response => expect(response.statusCode).to.equal(404))
              .then(() => simulateStatusUpdateFromTravisForPiDabToHelloWorld({ secret: cp.secret, port }))
              .then(() => wait(30000))
              .then(() => retry(5, () =>
                sendGetRequestToHelloEndpoint(port)
                  .then(response => expect(response.statusCode).to.equal(200)), 10000))
          })
      })
  })
})
