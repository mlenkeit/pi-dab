'use strict';

const exec = require('./exec');
const localtunnel = require('localtunnel');
const updateProject = require('./update-project');
const winston = require('winston');

module.exports = function(config) {
  const GITHUB_TOKEN = config.GITHUB_TOKEN;
  const GITHUB_USER = config.GITHUB_USER;
  const PORT = config.PORT;
  const projects = config.projects;
  
  const updateGitHubWebhook = require('./update-github-webhook')({
    githubToken: GITHUB_TOKEN,
    githubUser: GITHUB_USER,
    projects: projects
  });
  
  const openTunnel = require('./open-tunnel')({
    cb: url => {
      updateGitHubWebhook(url)
        .catch(err => {
          winston.log('error', `Failed to update GitHub webhook: ${err}`);
        });
    },
    port: PORT,
    localtunnel: localtunnel
  });
  
  const app = require('./app')({
    projects: projects,
    updateProject: updateProject
  });
  
  return {
    start: function() {
      return new Promise((resolve, reject) => {
        this.server = app.listen(PORT, function() {
          resolve();
        });
      });
    },
    stop: function() {
      return new Promise((resolve, reject) => {
        this.server.close();
        resolve();
      });
    }
  }
  
};