'use strict';

const assert = require('assert');
const async = require('async');
const request = require('request');

module.exports = function(config) {
  assert.equal(typeof config.githubToken, 'string', 'config.githubToken must be a string');
  assert.equal(typeof config.githubUser, 'string', 'config.githubUser must be a string');
  assert.ok(Array.isArray(config.projects), 'config.projects must be an array');

  return function(url) {
    return new Promise((resolve, reject) => {
      async.each(config.projects,
        (project, cb) => {
          request.patch({
            url: `https://api.github.com/repos/${project.name}/hooks/${project.githubWebhook}`,
            json: {
              config: {
                content_type: 'json',
                url: url
              }
            },
            auth: {
              username: config.githubUser,
              password: config.githubToken
            },
            headers: {
              'User-Agent': 'pi-dab'
            }
          }, (err, response, body) => {
            if (err) {
              return cb(err);
            }
            if (response.statusCode >= 400) {
              return cb(new Error(`Erroneous status code ${response.statusCode}`));
            }
            cb();
          });  
        },
        err => {
          return err ? reject(err) : resolve();
        })
    });
  };
  
};