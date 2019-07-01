'use strict'

const check = require('check-types')
const rp = require('request-promise-native')

const logger = require('./lib/logger')()
const obfuscateString = require('./lib/obfuscate-string')

logger.log('info', 'running healthcheck')
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_USER = process.env.GITHUB_USER
check.assert.nonEmptyString(GITHUB_USER, 'environment variable GITHUB_USER may not be empty')
check.assert.nonEmptyString(GITHUB_TOKEN, 'environment variable GITHUB_TOKEN may not be empty')
logger.log('debug', 'using GitHub user %s with token %s', GITHUB_USER, obfuscateString(GITHUB_TOKEN))

const PROJECTS = process.env.PROJECTS
check.assert.nonEmptyString(PROJECTS, 'environment variable PROJECTS may not be empty')
const PROJECTS_ROOT_DIR = process.env.PROJECTS_ROOT_DIR || '.projects'
logger.log('debug', 'loading projects from %s', PROJECTS)
logger.log('debug', 'storing projects in %s', PROJECTS_ROOT_DIR)
const projects = require(PROJECTS)

const piDabProject = projects.find(project => project.name === 'mlenkeit/pi-dab')
if (!piDabProject) {
  logger.log('error', 'could not find configuration for mlenkeit/pi-dab project')
  process.exit(1)
}

const getWebhookUrl = ({ repoName, webhookId, githubUser, githubToken }) => rp.get({
  url: `https://api.github.com/repos/${repoName}/hooks/${webhookId}`,
  json: true,
  auth: {
    username: githubUser,
    password: githubToken
  },
  headers: {
    'User-Agent': 'pi-dab-healthcheck'
  },
  transform: body => body.config.url
})

getWebhookUrl({
  repoName: piDabProject.name,
  webhookId: piDabProject.githubWebhook,
  githubUser: GITHUB_USER,
  githubToken: GITHUB_TOKEN
}).then(webhookUrl => {
  logger.log('debug', 'found webhook url %s', webhookUrl)
  return rp.get({
    uri: webhookUrl,
    resolveWithFullResponse: true
  })
}).then(response => {
  if (response.statusCode === 200) {
    logger.log('info', 'healthcheck successful')
    return process.exit(0)
  }
  throw new Error(`Unexpected status code ${response.statusCode} instead of 200`)
}).catch(err => {
  logger.log('error', 'healthcheck failed: %s', err)
  return process.exit(1)
})
