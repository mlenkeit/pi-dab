'use strict'

const exec = require('./exec')
const localtunnel = require('localtunnel')
const updateProject = require('./update-project')({ exec: exec })
const uuid = require('uuid/v4')
const winston = require('winston')

module.exports = function (config) {
  const GITHUB_TOKEN = config.GITHUB_TOKEN
  const GITHUB_USER = config.GITHUB_USER
  const PORT = config.PORT
  const projects = config.projects

  const secret = uuid()
  winston.info(`Using generated secret ${secret}`)

  const updateGitHubWebhook = require('./update-github-webhook')({
    githubToken: GITHUB_TOKEN,
    githubUser: GITHUB_USER,
    projects: projects,
    secret: secret
  })

  require('./open-tunnel')({
    cb: url => {
      updateGitHubWebhook(url)
        .catch(err => {
          winston.log('error', `Failed to update GitHub webhook: ${err}`)
        })
    },
    port: PORT,
    localtunnel: localtunnel
  })

  const app = require('./app')({
    projects: projects,
    secret: secret,
    updateProject: updateProject
  })

  return {
    start: function () {
      return new Promise((resolve/*, reject */) => {
        this.server = app.listen(PORT, function () {
          resolve()
        })
      })
    },
    stop: function () {
      return new Promise((resolve/*, reject */) => {
        this.server.close()
        resolve()
      })
    }
  }
}
