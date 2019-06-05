/* eslint-env mocha */
'use strict'

const chai = require('chai')
const expect = require('chai').expect
const path = require('path')
const sinon = require('sinon')

chai.use(require('chai-as-promised'))
chai.use(require('sinon-chai'))

describe('update-project', function () {
  beforeEach(function () {
    this.stdio = {
      stdout: Buffer.from('Hello World'),
      stderr: Buffer.from('Hello Error')
    }
    this.exec = sinon.stub().resolves(this.stdio)

    this.updateProject = require('./../../lib/update-project')({
      exec: this.exec
    })

    this.project = {
      name: 'some-user/some-repo',
      dir: path.resolve(__dirname, '../fixture/sample-proj'),
      postCheckoutScript: 'pm2 restart'
    }
    this.sha = '7654abc789'
  })

  it('fetches the latest changes for the Git repo from remote `origin`', function () {
    return this.updateProject(this.project, this.sha)
      .then(() => {
        const cmdMatcher = sinon.match('git fetch origin')
        const optMatcher = sinon.match.has('cwd', this.project.dir)
        expect(this.exec).to.be.calledWith(cmdMatcher, optMatcher)
      })
  })

  it('resets the Git repo to the specified state', function () {
    return this.updateProject(this.project, this.sha)
      .then(() => {
        const cmdMatcher = sinon.match(`git reset --hard ${this.sha}`)
        const optMatcher = sinon.match.has('cwd', this.project.dir)
        expect(this.exec).to.be.calledWith(cmdMatcher, optMatcher)
      })
  })

  it('rejects the promise when Git operations fail', function () {
    this.exec.withArgs(sinon.match('git')).rejects()
    return expect(this.updateProject(this.project, this.sha))
      .to.be.rejected
  })

  describe('after checkout', function () {
    it('executes actions of type `cmd`', function () {
      return this.updateProject(this.project, this.sha)
        .then(() => {
          const cmdMatcher = sinon.match('pm2 restart')
          const optMatcher = sinon.match.has('cwd', this.project.dir)
          expect(this.exec).to.be.calledWith(cmdMatcher, optMatcher)
        })
    })

    it('rejects the promise when an action fails', function () {
      this.exec.withArgs(sinon.match('pm2 restart')).rejects()
      return expect(this.updateProject(this.project, this.sha))
        .to.be.rejected
    })
  })
})
