'use strict';

const exec = require('child_process').exec;
const execSync = require('child_process').execSync;
const expect = require('chai').expect;
const fs = require('fs');
const kill = require('tree-kill');
const path = require('path');
const request = require('request');

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
      resolve()
    });
  });
};

describe('System Test: Update GitHub Webhook', function() {
  
  beforeEach(function() {
    const cmds = [
      'rm -rf pi-dab-test',
      'git clone https://github.com/mlenkeit/pi-dab-test.git',
      'cd pi-dab-test',
      'git reset --hard f8fe75b0088d0a21804f23fc59f2d926e4d13ec2'
    ]
    execSync(cmds.join(' && '), {
      cwd: path.resolve(__dirname, './../fixture'),
      env: process.env
    })
  });
  
  afterEach(function() {
    if (this.cp) kill(this.cp.pid);
  });
  
  it('updates the webhook url on GitHub', function() {
    const filepath = path.resolve(__dirname, './../fixture/pi-dab-test/HelloWorld.md');
    const dirpath = path.resolve(__dirname, './../fixture/pi-dab-test/node_modules');
    
    expect(() => fs.accessSync(filepath), 'new file does not exist')
      .to.throw();
    expect(() => fs.accessSync(dirpath), 'post checkout action results do not exist')
      .to.throw();
    
    return startPiDabUntilTunnelOpened()
      .then(cp => {
        this.cp = cp;
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