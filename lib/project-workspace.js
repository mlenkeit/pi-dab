'use strict'

const check = require('check-types')
const fs = require('fs')
const path = require('path')
const util = require('util')

const stat = util.promisify(fs.stat)

module.exports = function (config) {
  check.assert.function(config.exec, 'config.exec must be of type function')
  check.assert.string(config.projectsRootDir, 'config.projectsRootDir must be of type string')

  const logger = config.logger || require('./logger')()

  const ensureProjectsRootDirExists = () => stat(config.projectsRootDir)
    .catch(() => {
      logger.log('info', 'creating projects root directory %s', config.projectsRootDir)
      return config.exec(`mkdir -p ${config.projectsRootDir}`)
    })

  const ensureProjectDirExists = project => stat(getProjectDir(project))
    .catch(() => {
      logger.log('info', 'creating project directory for project %s in %s', project.name, getProjectDir(project))
      return config.exec(`mkdir -p ${getProjectDir(project)}`)
    })

  const ensureGitRepoExists = project => stat(path.resolve(getProjectDir(project), './.git'))
    .catch(() => {
      logger.log('info', 'cloning project %s into %s', project.name, getProjectDir(project))
      return config.exec(`git clone ${project.cloneUrl} ${getProjectDir(project)}`)
    })

  const getProjectDir = project => project.name === 'mlenkeit/pi-dab'
    ? path.resolve('/usr/src/app')
    : path.resolve(config.projectsRootDir, project.name)

  const checkGitRepoExists = project => stat(path.resolve(getProjectDir(project), './.git'))
    .then(() => ({ project, exists: true }))
    .catch(() => ({ project, exists: false }))

  const updateProject = (project, sha) => {
    const projectDir = getProjectDir(project)
    logger.log('info', 'check if project dir exists')
    return ensureProjectsRootDirExists()
      .then(() => ensureProjectDirExists(project))
      .then(() => ensureGitRepoExists(project))
      .then(() => {
        logger.log('info', `resetting project ${project.name} to ${sha}`)
        const cmd = `git fetch ${project.cloneUrl} && git reset --hard ${sha}`
        return config.exec(cmd, {
          cwd: projectDir
        })
      })
      .then(() => {
        if (project.postCheckoutScript) {
          logger.log('info', 'executing post checkout script %s in %s',
            project.postCheckoutScript,
            projectDir)
          return config.exec(project.postCheckoutScript, {
            cwd: projectDir
          }).then(stdio => {
            logger.log('info', stdio.stdout.toString())
            if (stdio.stderr) {
              logger.log('warn', stdio.stderr.toString())
            }
          })
        }
      })
  }

  const initProject = project => {
    logger.log('info', `initializing project ${project.name}`)
    updateProject(project, 'origin/master')
  }

  return {
    updateProject,
    initProject,
    checkGitRepoExists
  }
}
