'use strict'

const check = require('check-types')
const express = require('express')
const winston = require('winston')

const exec = require('./../lib/exec')

winston.log('info', 'starting pi-dab-launcher')

const PORT = parseInt(process.env.PORT, 10)
check.assert.positive(PORT, `environment variable PORT must be a positive number; found ${process.env.PORT}`)

const PI_DAB_DIR = process.env.PI_DAB_DIR
check.assert.nonEmptyString(PI_DAB_DIR, 'environment variable PI_DAB_DIR may not be empty')

const app = express()

app.get('/', (req, res, next) => {
  res.status(202).send()
  winston.log('info', 'restarting pi-dab...')
  exec('docker-compose up --force-recreate --build -d main', {
    cwd: PI_DAB_DIR
  }).then(() => {
    winston.log('info', 'pi-dab restarted')
  }).catch(next)
})

app.use(function (err, req, res, next) {
  if (err) winston.log('error', err)
  else winston.log('warn', 'no error to handle in error middleware')

  if (res.headersSent) {
    winston.log('warn', 'Header already sent')
    return next(err)
  }

  const statusCode = err.statusCode || 500
  res.status(statusCode).json(err)
})

app.listen(PORT, () => {
  winston.log('info', 'Started pi-dab-launcher on port %s', PORT)
})
