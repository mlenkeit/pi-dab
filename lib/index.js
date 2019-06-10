'use strict'

const exec = require('./exec')
const localtunnel = require('localtunnel')
const updateProjectFactory = require('./update-project')
const uuid = require('uuid/v4')

module.exports = function (config) {
  const GITHUB_TOKEN = config.GITHUB_TOKEN
  const GITHUB_USER = config.GITHUB_USER
  const PORT = config.PORT
  const PROJECTS_ROOT_DIR = config.PROJECTS_ROOT_DIR
  const projects = config.projects
  const logger = config.logger || require('./logger')()

  const secret = uuid()
  logger.info(`Using generated secret ${secret}`)

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
          logger.log('error', `Failed to update GitHub webhook: ${err}`)
        })
    },
    port: PORT,
    localtunnel: localtunnel,
    logger
  })

  const app = require('./app')({
    projects: projects,
    secret: secret,
    updateProject: updateProjectFactory({ exec: exec, projectsRootDir: PROJECTS_ROOT_DIR, logger }),
    logger
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
