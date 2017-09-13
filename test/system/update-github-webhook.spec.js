'use strict';

const exec = require('child_process').exec;
const expect = require('chai').expect;
const kill = require('tree-kill');
const path = require('path');
const request = require('request');

const getWebhookUrl = function() {
  return new Promise((resolve, reject) => {
    request.get({
      url: 'https://api.github.com/repos/mlenkeit/pi-dab-test/hooks/16107911',
      json: true,
      auth: {
        username: process.env.GITHUB_USER,
        password: process.env.GITHUB_TOKEN
      },
      headers: {
        'User-Agent': 'pi-dab'
      }
    }, (err, response, body) => {
      if (err) return reject(err);
      resolve(body.config.url);
    });
  });
};
const startPiDabUntilTunnelOpened = function() {
  return new Promise((resolve, reject) => {
    const cp = exec('node index.js', {
      cwd: path.resolve(__dirname, './../..'),
      env: process.env
    });
    cp.stdout.on('data', function(data) {
      if (/opened/i.test(data.toString())) {
        resolve(cp);
      }
    });
    cp.stderr.on('data', reject);
  });
};
const wait = function(timeout) {
  return new Promise(resolve => {
    setTimeout(resolve, timeout);
  });
};

describe('System Test: Update GitHub Webhook', function() {
  
  afterEach(function() {
    if (this.cp) kill(this.cp.pid);
  });
  
  it('updates the webhook url on GitHub', function() {
    this.timeout(10000);
    return getWebhookUrl()
      .then(initialUrl => {
        console.log('Initial url', initialUrl);
        
        return startPiDabUntilTunnelOpened()
          .then(cp => {
            this.cp = cp;
            return wait(1500);
          })
          .then(() => {
            return getWebhookUrl();
          })
          .then(updatedUrl => {
            console.log('Updated url', updatedUrl);
            expect(updatedUrl).not.to.equal(initialUrl);
          });
      });
  });
  
});