/* eslint-env mocha */
'use strict'

const chai = require('chai')
const expect = require('chai').expect
const path = require('path')
const sinon = require('sinon')
const tmp = require('tmp')

chai.use(require('chai-as-promised'))
chai.use(require('chai-fs'))
chai.use(require('sinon-chai'))

describe('update-project', function () {
  beforeEach(function () {
    this.projectsRootDir = tmp.dirSync().name
    console.log(`test: running with tmp dir ${this.projectsRootDir}`)

    this.project = {
      name: 'mlenkeit/pi-dab-test',
      cloneUrl: path.resolve(__dirname, './../fixture/pi-dab-test.git'),
      postCheckoutScript: 'echo "Hello"'
    }
    this.sha = 'b20bbc4f83e7f6175a6475b4bebd00b4546125d9'
    this.projectsDir = path.resolve(this.projectsRootDir, this.project.name)

    this.exec = sinon.spy(require('./../../lib/exec'))

    this.updateProject = require('./../../lib/update-project')({
      exec: this.exec,
      projectsRootDir: this.projectsRootDir
    })
  })

  context('if the project does not exist yet', function () {
    it('clones the project', function () {
      return this.updateProject(this.project, this.sha)
        .then(() => {
          expect(this.projectsDir).to.be.a.directory()
          expect(path.resolve(this.projectsDir, './.git')).to.be.a.directory()
        })
    })
  })

  context('if the project exists', function () {
    beforeEach(function () {
      return this.updateProject(this.project, this.sha)
        .then(() => {
          console.log('test: done cloning the project as fixture')
          this.sha = 'f8fe75b0088d0a21804f23fc59f2d926e4d13ec2'
        })
    })

    it('fetches the latest changes for the Git repo from remote `origin`', function () {
      return this.updateProject(this.project, this.sha)
        .then(() => {
          const cmdMatcher = sinon.match(`git fetch ${this.project.cloneUrl}`)
          const optMatcher = sinon.match.has('cwd', this.projectsDir)
          expect(this.exec).to.be.calledWith(cmdMatcher, optMatcher)
        })
    })

    it('resets the Git repo to the specified state', function () {
      return this.updateProject(this.project, this.sha)
        .then(() => {
          const cmdMatcher = sinon.match(`git reset --hard ${this.sha}`)
          const optMatcher = sinon.match.has('cwd', this.projectsDir)
          expect(this.exec).to.be.calledWith(cmdMatcher, optMatcher)
          expect(path.resolve(this.projectsDir, './.dab.json')).to.be.a.file()
        })
    })

    it('rejects the promise when Git operations fail', function () {
      this.sha = '123' // invalid
      return expect(this.updateProject(this.project, this.sha))
        .to.be.rejected
    })
  })

  context('after checkout', function () {
    it('executes actions of type `cmd`', function () {
      return this.updateProject(this.project, this.sha)
        .then(() => {
          const cmdMatcher = sinon.match('echo "Hello"')
          const optMatcher = sinon.match.has('cwd', this.projectsDir)
          expect(this.exec).to.be.calledWith(cmdMatcher, optMatcher)
        })
    })

    it('rejects the promise when an action fails', function () {
      this.project.postCheckoutScript = '2345tfds'
      return expect(this.updateProject(this.project, this.sha))
        .to.be.rejected
    })
  })
})
