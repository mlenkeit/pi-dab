'use strict';

const async = require('async');
const exec = require('child_process').exec;
const execSync = require('child_process').execSync;
const expect = require('chai').expect;
const fs = require('fs');
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
const post = function() {
  return new Promise((resolve, reject) => {
    request.post({
      url: `http://localhost:${process.env.PORT}`,
      json: {
        'id': 1234,
        'sha': '68098571a7658518bcfbfb7585bd613860dc8728',
        'name': 'mlenkeit/pi-dab-test',
        'context': 'continuous-integration/travis-ci/push',
        'state': 'success'
      }
    }, (err, response, body) => {
      if (err) return reject(err);
      console.log(response.statusCode, body);
      resolve();
    });
  });
};

describe('System Test', function() {
  
  beforeEach(function() {
    this.cps = [];
  });
  
  afterEach(function(done) {
    async.each(this.cps, function(cp, cb) {
      var pid = cp.pid;
      kill(pid, 'SIGKILL', function(/*err*/) {
        cb();
      });
    }, done);
  });
  
  describe('update GitHub wekhook', function() {
  
    it('changes the webhook url once started', function() {
      return getWebhookUrl()
        .then(initialUrl => {
          console.log('Initial url', initialUrl);
          
          return startPiDabUntilTunnelOpened()
            .then(cp => {
              this.cps.push(cp);
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
  
  describe('update project after build', function() {
    
    beforeEach(function() {
      const cmds = [
        'rm -rf pi-dab-test',
        'git clone https://github.com/mlenkeit/pi-dab-test.git',
        'cd pi-dab-test',
        'git reset --hard f8fe75b0088d0a21804f23fc59f2d926e4d13ec2'
      ];
      execSync(cmds.join(' && '), {
        cwd: path.resolve(__dirname, './../fixture'),
        env: process.env
      });
    });
    
    it('resets the Git working directory and applies .dab.json', function() {
      const filepath = path.resolve(__dirname, './../fixture/pi-dab-test/HelloWorld.md');
      const dirpath = path.resolve(__dirname, './../fixture/pi-dab-test/node_modules');
      
      expect(() => fs.accessSync(filepath), 'new file does not exist')
        .to.throw();
      expect(() => fs.accessSync(dirpath), 'post checkout action results do not exist')
        .to.throw();
      
      return startPiDabUntilTunnelOpened()
        .then(cp => {
          this.cps.push(cp);
          return post();
        })
        .then(() => {
          expect(fs.accessSync(filepath), 'new file')
            .to.be.undefined;
          expect(fs.accessSync(dirpath), 'post checkout action results')
            .to.be.undefined;
        });
    });
  });
  
});