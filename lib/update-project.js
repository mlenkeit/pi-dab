'use strict';

const check = require('check-types');
const winston = require('winston');

module.exports = function(config) {
  check.assert.function(config.exec, 'config.exec must be of type function');

  return function(project, sha) {
    winston.log('info', `Resetting repo to ${sha}`);
    const cmd = `git fetch origin && git reset --hard ${sha}`;
    return config.exec(cmd, {
      cwd: project.dir
    }).then(() => {
      if (project.postCheckoutScript) {
        winston.log('info', 'Executing post checkout script %s in %s', 
          project.postCheckoutScript,
          project.dir);
        return config.exec(project.postCheckoutScript, {
          cwd: project.dir
        }).then(stdio => {
          winston.log('info', stdio.stdout.toString());
          if (stdio.stderr) {
            winston.log('warn', stdio.stderr.toString());
          }
        });
      }
    });
  };
};