'use strict'

const check = require('check-types')
const express = require('express')

const exec = require('./../lib/exec')
const logger = require('./../lib/logger')()

logger.log('info', 'starting pi-dab-launcher')

const PORT = parseInt(process.env.PORT, 10)
check.assert.positive(PORT, `environment variable PORT must be a positive number; found ${process.env.PORT}`)

const PI_DAB_DIR = process.env.PI_DAB_DIR
check.assert.nonEmptyString(PI_DAB_DIR, 'environment variable PI_DAB_DIR may not be empty')

const app = express()

app.get('/', (req, res, next) => {
  res.status(202).send()
  logger.log('info', 'restarting pi-dab...')
  exec('docker-compose up --force-recreate --build -d main', {
    cwd: PI_DAB_DIR
  }).then(() => {
    logger.log('info', 'pi-dab restarted')
  }).catch(next)
})

app.use(function (err, req, res, next) {
  if (err) logger.log('error', err)
  else logger.log('warn', 'no error to handle in error middleware')

  if (res.headersSent) {
    logger.log('warn', 'Header already sent')
    return next(err)
  }

  const statusCode = err.statusCode || 500
  res.status(statusCode).json(err)
})

app.listen(PORT, () => {
  logger.log('info', 'Started pi-dab-launcher on port %s', PORT)
})
