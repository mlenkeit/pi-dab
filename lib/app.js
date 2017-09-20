'use strict';

const assert = require('assert');
const check = require('check-types');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const express = require('express');
const winston = require('winston');

module.exports = function(config) {
  assert.ok(Array.isArray(config.projects), 'config.projects must be an array');
  assert.equal(typeof config.updateProject, 'function', 'config.updateProject must be a function');
  assert.equal(typeof config.secret, 'string', 'config.secret must be a string');
  
  const app = express();
  
  const signPayload = function(secret, payload) {
    const blob = JSON.stringify(payload);
    return 'sha1=' + crypto.createHmac('sha1', secret).update(blob).digest('hex');
  };
  
  app.post('/', bodyParser.json(), (req, res, next) => {
    const payload = req.body;
    const payloadSignature = signPayload(config.secret, payload);
    if (payloadSignature !== req.get('X-Hub-Signature')) {
      const err = new Error('Invalid X-Hub-Signature');
      err.statusCode = 400;
      return next(err);
    }
    
    const validPayload = check.all(check.map(payload, {
      branches: check.array,
      context: check.string,
      state: check.string
    }));
    if (!validPayload) {
      const err = new Error('Invalid payload');
      err.statusCode = 400;
      return next(err);
    }
    
    const project = config.projects.find(project => project.name === payload.name);
    if (!project) {
      const err = new Error('Project not configured');
      err.statusCode = 400;
      return next(err);
    }
    
    const eventOnMaster = payload.branches.find(branch => branch.name === 'master');
    if (!eventOnMaster) {
      return res.status(202).json();
    }
    
    if (payload.context !== 'continuous-integration/travis-ci/push'
      || payload.state !== 'success') {
      return res.status(202).json();
    }
    
    res.status(202).json();
    winston.log('info', `Updating project ${project.name}...`);
    config.updateProject(project, payload.sha)
      .then(() => {
        winston.log('info', `Project ${project.name} updated.`);
      })
      .catch(next);
  });
  
  app.use(function(err, req, res, next) {
    winston.log('error', err);
    
    if (res.headersSent) {
      winston.log('warn', 'Header already sent');
      return next(err);
    }
    
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json(err);
  });
  
  return app;
};