'use strict';

const assert = require('assert');
const winston = require('winston');

module.exports = function(config) {
  assert.equal(typeof config.cb, 'function', 'config.cb must be a function');
  assert.equal(typeof config.port, 'number', 'config.port must be a number');
  assert.equal(typeof config.localtunnel, 'function', 'config.localtunnel must be a function');
  
  const openTunnel = () => {
    winston.log('info', `Opening tunnel to port ${config.port}...`);
    const tunnel = config.localtunnel(config.port, (err, tunnel) => {
      if (err) {
        winston.log('error', `Failed to open port: ${err}`);
        return process.exit(1);
      }
      winston.log('info', `Port ${config.port} opened via ${tunnel.url}.`);
      config.cb(tunnel.url);
    });
    
    tunnel.on('close', () => {
      winston.log('warn', `Tunnel to port ${config.port} closed`);
      openTunnel();
    });
    tunnel.on('error', err => {
      winston.log('warn', `Error on tunnel to port ${config.port}: ${err}`);
      openTunnel();
    });
  };
  
  openTunnel();
};