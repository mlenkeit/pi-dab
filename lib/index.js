'use strict'

const exec = require('./exec')
// const localtunnel = require('localtunnel')
const updateProjectFactory = require('./update-project')
const uuid = require('uuid/v4')

module.exports = function (config) {
  const GITHUB_TOKEN = config.GITHUB_TOKEN
  const GITHUB_USER = config.GITHUB_USER
  const PORT = config.PORT
  const PROJECTS_ROOT_DIR = config.PROJECTS_ROOT_DIR
  const projects = config.projects
  const logger = config.logger || require('./logger')()

  const LOCALTUNNEL_API_TOKEN = config.LOCALTUNNEL_API_TOKEN
  const LOCALTUNNEL_HOST = config.LOCALTUNNEL_HOST
  const LOCALTUNNEL_BASIC_AUTH = config.LOCALTUNNEL_BASIC_AUTH
  const NGROK_AUTH_TOKEN = config.NGROK_AUTH_TOKEN

  const secret = uuid()
  logger.info(`Using generated secret ${secret}`)

  const updateGitHubWebhook = require('./update-github-webhook')({
    githubToken: GITHUB_TOKEN,
    githubUser: GITHUB_USER,
    projects: projects,
    secret: secret
  })

  require('./open-ngrok-tunnel')({
    cb: url => {
      console.log('updating github hook with ', url)
      updateGitHubWebhook(url)
        .catch(err => {
          logger.log('error', `Failed to update GitHub webhook: ${err}`)
        })
    },
    port: PORT,
    apiToken: LOCALTUNNEL_API_TOKEN,
    localtunnelOrigin: `wss://${LOCALTUNNEL_HOST}`,
    localtunnelWebhookUrl: `https://${LOCALTUNNEL_BASIC_AUTH}@${LOCALTUNNEL_HOST}/pi-dab`,
    authToken: NGROK_AUTH_TOKEN,
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
