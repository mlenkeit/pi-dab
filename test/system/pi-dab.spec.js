/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
'use strict'

const async = require('async')
const chai = require('chai')
const check = require('check-types')
const dotenv = require('dotenv')
const exec = require('child_process').exec
const expect = require('chai').expect
const fs = require('fs')
const kill = require('tree-kill')
const path = require('path')
const rp = require('request-promise-native')
const tmp = require('tmp')

chai.use(require('chai-fs'))

const obfuscateString = require('./../../lib/obfuscate-string')
const payloadBuilder = require('./../util/github-webhook-payload-builder')
const webhookSimulator = require('./../util/github-webhook-simulator')
const retry = require('./../util/retry')
const wait = require('./../util/wait')

const getWebhookUrl = function ({ GITHUB_USER, GITHUB_TOKEN }) {
  check.assert.nonEmptyString(GITHUB_USER, 'env var GITHUB_USER empty')
  check.assert.nonEmptyString(GITHUB_TOKEN, 'env var GITHUB_TOKEN empty')
  console.log(`test: retrieving webhook url as GitHub user ${GITHUB_USER} with token ${obfuscateString(GITHUB_TOKEN)}`)

  const WEBHOOK_ID = 16107911
  return rp.get({
    url: `https://api.github.com/repos/mlenkeit/pi-dab-test/hooks/${WEBHOOK_ID}`,
    json: true,
    auth: {
      username: GITHUB_USER,
      password: GITHUB_TOKEN
    },
    headers: {
      'User-Agent': 'pi-dab'
    },
    transform: body => body.config.url
  })
}
const startPiDabUntilTunnelOpened = function ({ env }) {
  return new Promise((resolve, reject) => {
    const cp = exec('node index.js', {
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
        console.log('test: pi-dab started')
        resolve(cp)
      }
    })
    cp.stderr.on('data', reject)
  })
}

const simulateStatusUpdateFromTravisForPiDabTest = ({ secret, port }) => webhookSimulator({ port })
  .send(payloadBuilder()
    .contextTravisPush()
    .sha('68098571a7658518bcfbfb7585bd613860dc8728')
    .repo('mlenkeit/pi-dab-test')
    .build({ secret }))

describe('System Test', function () {
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

  describe('update GitHub wekhook', function () {
    it('changes the webhook url once started', function () {
      // not appplicable anymore as we have a static url
      return getWebhookUrl({
        GITHUB_USER: this.env.GITHUB_USER,
        GITHUB_TOKEN: this.env.GITHUB_TOKEN
      }).then(initialUrl => {
        console.log(`test: initial webhook url on pi-dab-test: ${initialUrl}`)
        return startPiDabUntilTunnelOpened({
          env: this.env
        }).then(cp => {
          this.cps.push(cp)
          return wait(1500)
        })
          .then(() => {
            return getWebhookUrl({
              GITHUB_USER: this.env.GITHUB_USER,
              GITHUB_TOKEN: this.env.GITHUB_TOKEN
            })
          })
          .then(updatedUrl => {
            console.log(`test: updated webhook url on pi-dab-test: ${updatedUrl}`)
            expect(updatedUrl).not.to.equal(initialUrl)
          })
      })
    })
  })

  // describe.only('startup', function() {
  //   it('clones projects that do not exist yet', function() {
  //     const filepath = path.resolve(this.env.PROJECTS_ROOT_DIR, './mlenkeit/pi-dab-test/HelloWorld.md')
  //     const dirpath = path.resolve(this.env.PROJECTS_ROOT_DIR, './mlenkeit/pi-dab-test/node_modules')
  //
  //     const checkRepeatedlyForFiles = () => retry(5, () => {
  //       return new Promise(resolve => {
  //         fs.accessSync(filepath)
  //         fs.accessSync(dirpath)
  //         resolve()
  //       })
  //     }, 1000)
  //     return startPiDabUntilTunnelOpened({ env: this.env })
  //       .then(cp => {
  //         this.cps.push(cp)
  //         return cp.secret
  //       })
  //       .then(() => wait(3000))
  //       .then(() => checkRepeatedlyForFiles())
  //       .then(() => {
  //         expect(filepath).to.be.a.file('new file does not exist')
  //         expect(dirpath).to.be.a.directory('post checkout action results do not exist')
  //       })
  //   })
  // })

  describe('update project after build', function () {
    it('resets the Git working directory and applies postCheckoutScript', function () {
      const filepath = path.resolve(this.env.PROJECTS_ROOT_DIR, './mlenkeit/pi-dab-test/HelloWorld.md')
      const dirpath = path.resolve(this.env.PROJECTS_ROOT_DIR, './mlenkeit/pi-dab-test/node_modules')

      expect(filepath).not.to.be.a.path('new file does not exist')
      expect(dirpath).not.to.be.a.path('post checkout action results do not exist')

      const checkRepeatedlyForFiles = () => retry(5, () => {
        return new Promise(resolve => {
          fs.accessSync(filepath)
          fs.accessSync(dirpath)
          resolve()
        })
      }, 1000)

      return startPiDabUntilTunnelOpened({ env: this.env })
        .then(cp => {
          this.cps.push(cp)
          return cp.secret
        })
        .then(secret => simulateStatusUpdateFromTravisForPiDabTest({ secret, port: this.env.PORT }))
        .then(() => checkRepeatedlyForFiles())
        .then(() => {
          expect(filepath).to.be.a.file('new file does not exist')
          expect(dirpath).to.be.a.directory('post checkout action results do not exist')
        })
    })
  })
})
