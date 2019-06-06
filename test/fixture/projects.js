'use strict'

const path = require('path')

module.exports = [{
  'name': 'mlenkeit/pi-dab-test',
  'cloneUrl': path.resolve(__dirname, 'pi-dab-test.git'),
  // 'dir': 'pi-dab-test',
  'githubWebhook': 16107911,
  'postCheckoutScript': 'npm install'
}]
