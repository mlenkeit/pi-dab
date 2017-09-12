'use strict';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_USER = process.env.GITHUB_USER;
const PORT = parseInt(process.env.PORT, 10);
const PROJECTS_JSON = process.env.PROJECTS_JSON;

const projects = require(PROJECTS_JSON);

const piDab = require('./lib/index')({
  GITHUB_TOKEN: GITHUB_TOKEN,
  GITHUB_USER: GITHUB_USER,
  PORT: PORT,
  projects: projects
});

piDab.start()
  .then(() => {
    console.log('Started');
  })
  .catch(err => {
    console.log('Error starting');
  });

