# pi-dab

[![Build Status](https://travis-ci.org/mlenkeit/pi-dab.svg?branch=master)](https://travis-ci.org/mlenkeit/pi-dab) [![Greenkeeper badge](https://badges.greenkeeper.io/mlenkeit/pi-dab.svg)](https://greenkeeper.io/)

> Deploy After Build (DAB) - Continuous Deployment for your Raspberry Pi

*pi-dab* ensures that when a project is successfully built with [Travis CI](https://travis-ci.org/), that this code is also checked out onto your Raspberry Pi and started. It runs on your Raspberry Pi in the background and uses [localtunnel](https://github.com/localtunnel/localtunnel) to expose itself to GitHub via webhooks of configured repositories, so you don't need to mess with network settings.

## Installation It

```shell
git clone https://github.com/mlenkeit/pi-dab.git
cd pi-dab
npm install --production
```

## Run It

```shell
GITHUB_TOKEN=<GITHUB_TOKEN> \ # see config
GITHUB_USER=<GITHUB_USER> \
PORT=5000 \
PROJECTS_JSON=<FILEPATH_TO_PROJECTS> \ # see config
npm test
```

## Configure It

### GitHub Token

*pi-dab* needs a GitHub token to set up the GitHub webhooks. Follow the [Create a personal access token](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/) and grant permission for `admin:repo_hook`.

You need to pass this token to *pi-dab* in the environment variable `GITHUB_TOKEN`.

### Projects

For each project that *pi-dab* should listen to, you can configure:
- name: the GitHub repo name including user/organization: `<user>/<repo>`
- dir: the directory on your pi where the project is located at
- githubWebhook: the id of the GitHub webhook that pi-dab should use
- postCheckoutScript: the commands that are executed after checkout. The `cwd` is `dir`, so can you e.g. run `npm install --production`.

Example:

```js
module.exports = [{
  name: 'mlenkeit/pi-dab',
  dir: '/home/pi/pi-dab',
  githubWebhook: 1234,
  postCheckoutScript: 'npm install --production'
}];
```