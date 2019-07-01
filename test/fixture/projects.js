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
  'postCheckoutScript': 'cp -r /usr/src/projects/mlenkeit/pi-dab /usr/src/share && curl "http://launcher:$PORT/"'
}]
