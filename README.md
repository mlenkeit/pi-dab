# pi-dab [![Build Status](https://travis-ci.org/mlenkeit/pi-dab.svg?branch=master)](https://travis-ci.org/mlenkeit/pi-dab)

[![Greenkeeper badge](https://badges.greenkeeper.io/mlenkeit/pi-dab.svg)](https://greenkeeper.io/)

> Deploy After Build (DAB) - Continuous Deployment for your Raspberry Pi

*pi-dab* ensures that when a project is successfully built with [Travis CI](https://travis-ci.org/), that this code is also checked out onto your Raspberry Pi and started. It runs on your Raspberry Pi in the background and uses [localtunnel](https://github.com/localtunnel/localtunnel) to expose itself to GitHub via webhooks of configured repositories, so you don't need to mess with network settings.

## Installation on Raspberry Pi

```shell
git clone https://github.com/mlenkeit/pi-dab.git
cd pi-dab
npm install --production

# projects that pi-dab listens to
echo "[]" > projects.json

# install pi-dab as a service
npm install -g forever
node scripts/create-svc.js
sudo cat pi-dab > /etc/init.d/pi-dab
sudo chmod +x /etc/init.d/pi-dab
sudo update-rc.d pi-dab defaults
```

## Configure projects.json

For each project that *pi-dab* should listen to, you can configure:
- name: the GitHub repo name including user/organization: `<user>/<repo>`
- dir: the directory on your pi where the project is located at
- githubWebhook: the id of the GitHub webhook that pi-dab should use

Example:

```json
[{
  "name": "mlenkeit/pi-dab",
  "dir": "/home/pi/pi-dab",
  "githubWebhook": 1234
}]
```