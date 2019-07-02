'use strict'

module.exports = function (config) {
  const workspace = require('./project-workspace')(config)
  return workspace.updateProject
}
