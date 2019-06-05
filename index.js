'use strict'

const path = require('path')
const winston = require('winston')

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_USER = process.env.GITHUB_USER
const PORT = parseInt(process.env.PORT, 10)
const PROJECTS = process.env.PROJECTS

const projectJsonDirname = path.dirname(PROJECTS)
const projects = require(PROJECTS)
  .map(project => {
    project.dir = path.resolve(projectJsonDirname, project.dir)
    return project
  })

const piDab = require('./lib/index')({
  GITHUB_TOKEN: GITHUB_TOKEN,
  GITHUB_USER: GITHUB_USER,
  PORT: PORT,
  projects: projects
})

piDab.start()
  .then(() => {
    winston.log('info', 'Started pi-dab')
  })
  .catch(err => {
    winston.log('error', 'Failed to start pi-dab', err)
  })
