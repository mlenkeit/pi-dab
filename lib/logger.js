'use strict'

const winston = require('winston')

module.exports = () => {
  const logger = winston.createLogger({
    format: winston.format.combine(
      winston.format.splat(),
      winston.format.simple()
    ),
    transports: [
      new winston.transports.Console()
    ]
  })
  return logger
}
