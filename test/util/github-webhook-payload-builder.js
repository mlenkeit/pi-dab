'use strict'

const crypto = require('crypto')

module.exports = () => {
  const builder = {
    _payload: {
      'id': 1234,
      'state': 'success',
      'branches': [{
        'name': 'master'
      }]
    },
    context: context => {
      builder._payload.context = context
      return builder
    },
    contextTravisPush: () => builder.context('continuous-integration/travis-ci/push'),
    sha: sha => {
      builder._payload.sha = sha
      return builder
    },
    repo: repo => {
      builder._payload.name = repo
      return builder
    },
    build: ({ secret }) => {
      const payload = builder._payload
      const signature = 'sha1=' + crypto.createHmac('sha1', secret).update(JSON.stringify(payload)).digest('hex')
      const signatureHeader = {
        'X-Hub-Signature': signature
      }
      return { payload, signature, signatureHeader }
    }
  }

  return builder
}
