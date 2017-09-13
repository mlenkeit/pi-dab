'use strict';

const assert = require('assert');
const bodyParser = require('body-parser');
const express = require('express');
const winston = require('winston');

module.exports = function(config) {
  assert.ok(Array.isArray(config.projects), 'config.projects must be an array');
  assert.equal(typeof config.updateProject, 'function', 'config.updateProject must be a function');
  
  const app = express();
  
  app.post('/', bodyParser.json(), (req, res, next) => {
    const payload = req.body;
    const project = config.projects.find(project => project.name === payload.name);
    
    if (payload.context !== 'continuous-integration/travis-ci/push'
      || payload.state !== 'success' 
      || !project) {
      return res.status(201).json();
    }
    
    winston.log('info', `Updating project ${project.name}...`);
    config.updateProject(project, payload.sha)
      .then(() => {
        res.status(201).json();
        winston.log('info', `Project ${project.name} updated.`);
      })
      .catch(next);
  });
  
  app.use(function(err, req, res, next) {
    if (res.headersSent) {
      return next(err);
    }
    
    winston.log('error', err);
    
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json(err);
  });
  
  return app;
};