'use strict';

const exec = require('child_process').exec;
const request = require('request');

request.get({
  url: `https://api.github.com/repos/mlenkeit/pi-dab-test/hooks/16107911`,
  json: true,
  auth: {
    username: process.env.GITHUB_USER,
    password: process.env.GITHUB_TOKEN
  },
  headers: {
    'User-Agent': 'pi-dab'
  }
}, (err, response, body) => {
  console.log(body.config.url);
  
  const cp = exec('node index.js');
  cp.stdout.on('data', function(data) {
    if (/opened/i.test(data.toString())) {
      setTimeout(function() {
        request.get({
          url: `https://api.github.com/repos/mlenkeit/pi-dab-test/hooks/16107911`,
          json: true,
          auth: {
            username: process.env.GITHUB_USER,
            password: process.env.GITHUB_TOKEN
          },
          headers: {
            'User-Agent': 'pi-dab'
          }
        }, (err, response, body) => {
          console.log(body.config.url);
        });
      }, 2000);
      
    }
  })
  
  
});


