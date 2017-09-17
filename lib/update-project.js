'use strict';

const assert = require('assert');
const winston = require('winston');

module.exports = function(config) {
  assert.equal(typeof config.exec, 'function', 'config.exec must be a function');

  return function(project, sha) {
    winston.log('info', `Resetting repo to ${sha}`);
    const cmd = `git fetch origin && git reset --hard ${sha}`;
    return config.exec(cmd, {
      cwd: project.dir
    }).then(() => {
      if (project.postCheckoutScript) {
        winston.log('info', 'Executing post checkout script', project.postCheckoutScript);
        return config.exec(project.postCheckoutScript, {
          cwd: project.dir
        });
      }
    });
  };
};