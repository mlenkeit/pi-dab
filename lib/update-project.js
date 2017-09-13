'use strict';

const assert = require('assert');
const async = require('async');
const path = require('path');
const winston = require('winston');

module.exports = function(config) {
  assert.equal(typeof config.exec, 'function', 'config.exec must be a function');

  return function(project, sha) {
    winston.log('info', `Resetting repo to ${sha}`);
    const cmd = `git fetch origin && git reset --hard ${sha}`;
    return config.exec(cmd, {
      cwd: project.dir
    }).then(() => {
      return require(path.resolve(project.dir, '.dab.json'));
    }).then(dabDescriptor => new Promise((resolve, reject) => {
      async.eachSeries(dabDescriptor.postCheckoutActions,
        (action, cb) => {
          winston.log('info', 'Executing post checkout action', action);
          if (action.type === 'cmd') {
            config.exec(action.cmd, {
              cwd: project.dir
            }).then(stdout => cb(null, stdout))
              .catch(cb);
          } else {
            cb(new Error(`Unknown action type ${action.type}`));
          }
        },
        (err, result) => err ? reject(err) : resolve(result)
      );
    }));
  };
};