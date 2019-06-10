'use strict'

const rp = require('request-promise-native')

module.exports = ({ port }) => {
  return {
    send: ({ payload, signatureHeader }) => rp.post({
      url: `http://localhost:${port}`,
      json: payload,
      headers: {
        ...signatureHeader
      },
      simple: false,
      resolveWithFullResponse: true
    }).then(response => {
      console.log(`test: simulating GitHub webhook resulted in status code ${response.statusCode}`)
      if (response.statusCode !== 202) throw new Error(`Unexpected status code ${response.statusCode} when simulating GitHub webhook; expected 202`)
    })
  }
}
