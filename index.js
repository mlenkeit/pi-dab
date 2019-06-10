'use strict'

const check = require('check-types')
const path = require('path')
const winston = require('winston')

const obfuscateString = require('./lib/obfuscate-string')

const logger = winston.createLogger({
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console()
  ]
})

logger.log('info', 'starting pi-dab')
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_USER = process.env.GITHUB_USER
check.assert.nonEmptyString(GITHUB_USER, 'environment variable GITHUB_USER may not be empty')
check.assert.nonEmptyString(GITHUB_TOKEN, 'environment variable GITHUB_TOKEN may not be empty')
logger.log('info', 'using GitHub user %s with token %s', GITHUB_USER, obfuscateString(GITHUB_TOKEN))

const PORT = parseInt(process.env.PORT, 10)
check.assert.positive(PORT, `environment variable PORT must be a positive number; found ${process.env.PORT}`)

const PROJECTS = process.env.PROJECTS
check.assert.nonEmptyString(PROJECTS, 'environment variable PROJECTS may not be empty')
const PROJECTS_ROOT_DIR = process.env.PROJECTS_ROOT_DIR || '.projects'
logger.log('info', 'loading projects from %s', PROJECTS)
logger.log('info', 'storing projects in %s', PROJECTS_ROOT_DIR)
const projects = require(PROJECTS)
logger.log('info', `projects: %j`, projects)

const piDab = require('./lib/index')({
  GITHUB_TOKEN: GITHUB_TOKEN,
  GITHUB_USER: GITHUB_USER,
  PORT: PORT,
  projects: projects,
  PROJECTS_ROOT_DIR: path.resolve(process.cwd(), PROJECTS_ROOT_DIR),
  logger
})

process.on('SIGTERM', () => {
  piDab.stop()
    .then(() => console.log('server stopped'))
})

piDab.start()
  .then(() => {
    logger.log('info', 'Started pi-dab')
  })
  .catch(err => {
    logger.log('error', 'Failed to start pi-dab', err)
  })
