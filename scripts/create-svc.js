'use strict';

const execSync = require('child_process').execSync;
const fs = require('fs');
const program = require('commander');

const pkg = require('./../package.json');
 
program
  .version(pkg.version)
  .option('-u, --gh-user [user]', 'GitHub username')
  .option('-t, --gh-token [token]', 'GitHub token')
  .option('-p, --port [port]', 'Port number')
  .option('-P, --projects-json [path]', 'Path to projects.json')
  .option('--forever-path [path]', 'Path to forever')
  .option('--node-path [path]', 'Path to node')
  .parse(process.argv);
  
const mandatoryOptions = [
  'ghUser', 'ghToken', 'port', 'projectsJson'
];
const validOptions = mandatoryOptions
  .reduce((valid, mandatoryOption) => {
    if (!program[mandatoryOption]) {
      console.log(`  Missing mandatory option ${mandatoryOption}`);
      valid = false;
    }
    return valid;
  }, true);
  
const optionalScriptPathsOptions = ['forever', 'node'];
const validScriptPathOptions = optionalScriptPathsOptions.
  reduce((valid, scriptName) => {
    const optionName = `${scriptName}Path`;
    if (!program[optionName]) {
      try {
        console.log(`No --${scriptName}-path option provided, looking up ${scriptName}...`);
        const scriptPath = execSync(`which ${scriptName}`);
        program[optionName] = scriptPath;
        console.log(`Using ${scriptName} at ${scriptPath}`);
      } catch (e) {
        console.log(`Could not find ${scriptName}`);
        valid = false;
      }
    }
    return valid;
  }, true);
  
if (!validOptions || !validScriptPathOptions) {
  return program.help();
}

const service = `#!/bin/sh
#/etc/init.d/pi-dab
case "$1" in
  start)
    export GITHUB_TOKEN=${program.ghToken}
    export GITHUB_USER=${program.ghUser}
    export PORT=${program.port}
    export PROJECTS_JSON=${program.projectsJson}
    exec ${program.foreverPath} start -p ${process.env.HOME}/.forever -c ${program.nodePath} ${process.env.PWD}/index.js
    ;;
  stop)
    exec ${program.foreverPath} stop -c ${program.nodePath} ${process.env.PWD}/index.js
    ;;
  restart)
    export GITHUB_TOKEN=${program.ghToken}
    export GITHUB_USER=${program.ghUser}
    export PORT=${program.port}
    export PROJECTS_JSON=${program.projectsJson}
    exec ${program.foreverPath} restart -p ${process.env.HOME}/.forever -c ${program.nodePath} ${process.env.PWD}/index.js
    ;;
  *)
    echo "Wrong parameters"
    exit 1
    ;;
esac
exit 0;
`;

fs.writeFileSync('./pi-dab', service);
