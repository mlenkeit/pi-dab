'use strict'

const check = require('check-types')
const fs = require('fs')
const path = require('path')
const util = require('util')
const winston = require('winston')

const stat = util.promisify(fs.stat)

module.exports = function (config) {
  check.assert.function(config.exec, 'config.exec must be of type function')
  check.assert.string(config.projectsRootDir, 'config.projectsRootDir must be of type string')

  const ensureProjectsRootDirExists = () => stat(config.projectsRootDir)
    .catch(() => {
      winston.log('info', 'creating projects root directory %s', config.projectsRootDir)
      return config.exec(`mkdir -p ${config.projectsRootDir}`)
    })

  const ensureProjectDirExists = (project, projectDir) => stat(projectDir)
    .catch(() => {
      winston.log('info', 'creating project directory for project %s in %s', project.name, projectDir)
      return config.exec(`mkdir -p ${projectDir}`)
    })

  const ensureGitRepoExists = (project, projectDir) => stat(path.resolve(projectDir, './.git'))
    .catch(() => {
      winston.log('info', 'cloning project %s into %s', project.name, projectDir)
      return config.exec(`git clone ${project.cloneUrl} ${projectDir}`)
    })

  return function (project, sha) {
    const projectDir = path.resolve(config.projectsRootDir, project.name)
    winston.log('info', `Resetting project ${project.name} to ${sha}`)
    const cmd = `git fetch ${project.cloneUrl} --all && git reset --hard ${sha}`
    winston.log('info', 'check if project dir exists')
    return ensureProjectsRootDirExists()
      .then(() => ensureProjectDirExists(project, projectDir))
      .then(() => ensureGitRepoExists(project, projectDir))
      .then(() => {
        return config.exec(cmd, {
          cwd: projectDir
        })
      })
      .then(() => {
        if (project.postCheckoutScript) {
          winston.log('info', 'Executing post checkout script %s in %s',
            project.postCheckoutScript,
            projectDir)
          return config.exec(project.postCheckoutScript, {
            cwd: projectDir
          }).then(stdio => {
            winston.log('info', stdio.stdout.toString())
            if (stdio.stderr) {
              winston.log('warn', stdio.stderr.toString())
            }
          })
        }
      })
  }
}
