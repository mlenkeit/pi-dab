'use strict'

const winston = require('winston')

module.exports = () => {
  const logger = winston.createLogger({
    format: winston.format.combine(
      winston.format.splat(),
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      // winston.format.simple(),
      winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
    ),
    transports: [
      new winston.transports.Console()
    ]
  })
  return logger
}
