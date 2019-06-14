'use strict'

const async = require('async')
const check = require('check-types')
const rp = require('request-promise-native')

module.exports = function (config) {
  check.assert.string(config.githubToken, 'config.githubToken must be of type string')
  check.assert.string(config.githubUser, 'config.githubUser must be of type string')
  check.assert.array(config.projects, 'config.projects must be of type array')
  check.assert.string(config.secret, 'config.secret must be of type string')

  return async url =>
    async.each(config.projects, async project =>
      rp.patch({
        url: `https://api.github.com/repos/${project.name}/hooks/${project.githubWebhook}`,
        json: {
          config: {
            content_type: 'json',
            url: url,
            secret: config.secret
          },
          events: ['status']
        },
        auth: {
          username: config.githubUser,
          password: config.githubToken
        },
        headers: {
          'User-Agent': 'pi-dab'
        }
      })
    )
}
