'use strict'

const path = require('path')

module.exports = [{
  'name': 'mlenkeit/pi-dab-test',
  'cloneUrl': path.resolve(__dirname, 'pi-dab-test.git'),
  // 'dir': 'pi-dab-test',
  'githubWebhook': 16107911,
  'postCheckoutScript': 'npm install'
}, {
  'name': 'mlenkeit/pi-dab',
  'cloneUrl': 'https://github.com/mlenkeit/pi-dab.git',
  'githubWebhook': 16109011,
  'postCheckoutScript': 'mkdir -p /usr/src/share/pi-dab && cp -r /usr/src/app /usr/src/share/pi-dab && curl "http://launcher:$PORT/"'
}]
