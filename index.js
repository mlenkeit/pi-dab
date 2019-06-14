'use strict'

const check = require('check-types')
const path = require('path')
const winston = require('winston')

const obfuscateString = require('./lib/obfuscate-string')

winston.log('info', 'starting pi-dab')
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_USER = process.env.GITHUB_USER
check.assert.nonEmptyString(GITHUB_USER, 'environment variable GITHUB_USER may not be empty')
check.assert.nonEmptyString(GITHUB_TOKEN, 'environment variable GITHUB_TOKEN may not be empty')
winston.log('info', 'using GitHub user %s with token %s', GITHUB_USER, obfuscateString(GITHUB_TOKEN))

const PORT = parseInt(process.env.PORT, 10)
check.assert.positive(PORT, `environment variable PORT must be a positive number; found ${process.env.PORT}`)

const PROJECTS = process.env.PROJECTS
check.assert.nonEmptyString(PROJECTS, 'environment variable PROJECTS may not be empty')
const PROJECTS_ROOT_DIR = process.env.PROJECTS_ROOT_DIR || '.projects'
winston.log('info', 'loading projects from %s', PROJECTS)
winston.log('info', 'storing projects in %s', PROJECTS_ROOT_DIR)
const projects = require(PROJECTS)
winston.log('info', `projects: %j`, projects)

const piDab = require('./lib/index')({
  GITHUB_TOKEN: GITHUB_TOKEN,
  GITHUB_USER: GITHUB_USER,
  PORT: PORT,
  projects: projects,
  PROJECTS_ROOT_DIR: path.resolve(process.cwd(), PROJECTS_ROOT_DIR)
})

piDab.start()
  .then(() => {
    winston.log('info', 'Started pi-dab')
  })
  .catch(err => {
    winston.log('error', 'Failed to start pi-dab', err)
  })
