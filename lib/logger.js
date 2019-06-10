'use strict'

const winston = require('winston')

module.exports = () => {
  const logger = winston.createLogger({
    transports: [
      new winston.transports.Console()
    ]
  })
  return logger
}
