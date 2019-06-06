/* eslint-env mocha */
'use strict'

const expect = require('chai').expect

const obfuscateString = require('./../../lib/obfuscate-string')

describe('obfuscate-string', function () {
  it('keeps the last n characters', function () {
    const inp = '123456789'
    const keep = 4
    const exp = '*****6789'
    expect(obfuscateString(inp, keep)).to.equal(exp)
  })

  it('keeps the last 3 characters by default', function () {
    const inp = '123456789'
    const exp = '******789'
    expect(obfuscateString(inp)).to.equal(exp)
  })
})
