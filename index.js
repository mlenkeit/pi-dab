'use strict'

const check = require('check-types')
const path = require('path')
const winston = require('winston')

const obfuscateString = require('./lib/obfuscate-string')

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.splat(),
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    // winston.format.simple(),
    winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
  ),
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

const LOCALTUNNEL_API_TOKEN = process.env.LOCALTUNNEL_API_TOKEN
const LOCALTUNNEL_HOST = process.env.LOCALTUNNEL_HOST
const LOCALTUNNEL_BASIC_AUTH = process.env.LOCALTUNNEL_BASIC_AUTH
check.assert.nonEmptyString(LOCALTUNNEL_API_TOKEN, 'environment variable LOCALTUNNEL_API_TOKEN may not be empty')
check.assert.nonEmptyString(LOCALTUNNEL_HOST, 'environment variable LOCALTUNNEL_HOST may not be empty')
check.assert.nonEmptyString(LOCALTUNNEL_BASIC_AUTH, 'environment variable LOCALTUNNEL_BASIC_AUTH may not be empty')
logger.log('info', 'using localtunnel host %s', LOCALTUNNEL_HOST)

const NGROK_AUTH_TOKEN = process.env.NGROK_AUTH_TOKEN
check.assert.nonEmptyString(NGROK_AUTH_TOKEN, 'environment variable NGROK_AUTH_TOKEN may not be empty')
logger.log('info', 'using ngrok token %s', obfuscateString(NGROK_AUTH_TOKEN))

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
  LOCALTUNNEL_API_TOKEN: LOCALTUNNEL_API_TOKEN,
  LOCALTUNNEL_HOST: LOCALTUNNEL_HOST,
  LOCALTUNNEL_BASIC_AUTH: LOCALTUNNEL_BASIC_AUTH,
  NGROK_AUTH_TOKEN: NGROK_AUTH_TOKEN,
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
