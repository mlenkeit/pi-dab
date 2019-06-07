'use strict'

const check = require('check-types')
const bodyParser = require('body-parser')
const crypto = require('crypto')
const exec = require('./exec')
const express = require('express')
const path = require('path')

module.exports = function (config) {
  check.assert.array(config.projects, 'config.projects must be of type array')
  check.assert.string(config.secret, 'config.secret must be of type string')
  check.assert.function(config.updateProject, 'config.updateProject must be of type function')

  const logger = config.logger || require('./logger')()
  const app = express()

  const signPayload = function (secret, payload) {
    const blob = JSON.stringify(payload)
    return 'sha1=' + crypto.createHmac('sha1', secret).update(blob).digest('hex')
  }

  app.get('/', (req, res, next) => {
    const pkg = require('./../package')
    exec('git log -1', { cwd: path.resolve(__dirname, './..') })
      .then(({ stdout }) => {
        res
          .status(200)
          .set('content-type', 'text/plain')
          .send(`${pkg.name}@${pkg.version}\n\n---\n\n${stdout.toString()}`)
      }).catch(next)
  })

  app.get('/hello', (req, res) => {
    res
      .status(200)
      .set('content-type', 'text/plain')
      .send('hello world')
  })

  app.post('/', bodyParser.json(), (req, res, next) => {
    const payload = req.body
    const payloadSignature = signPayload(config.secret, payload)
    if (payloadSignature !== req.get('X-Hub-Signature')) {
      const err = new Error(`Invalid X-Hub-Signature in message from repository ${payload.name}`)
      err.statusCode = 400
      return next(err)
    }

    const validPayload = check.all(check.map(payload, {
      branches: check.array,
      context: check.string,
      state: check.string
    }))
    if (!validPayload) {
      const err = new Error('Invalid payload')
      err.statusCode = 400
      return next(err)
    }

    const project = config.projects.find(project => project.name === payload.name)
    if (!project) {
      const err = new Error('Project not configured')
      err.statusCode = 400
      return next(err)
    }

    const eventOnMaster = payload.branches.find(branch => branch.name === 'master')
    if (!eventOnMaster) {
      return res.status(202).json()
    }

    if (payload.context !== 'continuous-integration/travis-ci/push' ||
      payload.state !== 'success') {
      return res.status(202).json()
    }

    res.status(202).json()
    logger.log('info', `Updating project ${project.name}...`)
    config.updateProject(project, payload.sha)
      .then(() => {
        logger.log('info', `Project ${project.name} updated.`)
      })
      .catch(next)
  })

  app.use(function (err, req, res, next) {
    if (err) logger.log('error', err)
    else logger.log('warn', 'no error to handle in error middleware')

    if (res.headersSent) {
      logger.log('warn', 'Header already sent')
      return next(err)
    }

    const statusCode = err.statusCode || 500
    res.status(statusCode).json(err)
  })

  return app
}
