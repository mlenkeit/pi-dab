/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
'use strict'

const chai = require('chai')
const crypto = require('crypto')
const expect = require('chai').expect
const sinon = require('sinon')
const request = require('supertest')

chai.use(require('sinon-chai'))

const signPayload = function (secret, payload) {
  const blob = JSON.stringify(payload)
  return 'sha1=' + crypto.createHmac('sha1', secret).update(blob).digest('hex')
}

describe('app', function () {
  beforeEach(function () {
    this.updateProject = sinon.stub()
    this.projects = []
    this.secret = 's3cret'

    this.app = require('./../../lib/app')({
      updateProject: this.updateProject,
      projects: this.projects,
      secret: this.secret
    })
  })

  describe('GET /', function () {
    it('responds with 200 and project metadata', function (done) {
      request(this.app)
        .get('/')
        .expect(200)
        .expect('content-type', 'text/plain; charset=utf-8')
        .expect(res => {
          expect(res.text).to.include('pi-dab@0.1.0')
          // Git commit metadata
          expect(res.text).to.include('Author:')
          expect(res.text).to.include('Date:')
        })
        .end(done)
    })
  })

  describe('POST /', function () {
    context('when called with Travis success state', function () {
      beforeEach(function () {
        this.payload = {
          'id': 1234,
          'sha': '5678',
          'name': 'some-user/some-repo',
          'context': 'continuous-integration/travis-ci/push',
          'state': 'success',
          'branches': [{
            'name': 'master'
          }]
        }
      })

      context('for a configured project', function () {
        beforeEach(function () {
          this.project = {
            name: this.payload.name
          }
          this.projects.push(this.project)
        })

        it('responds with 202 and afterwards updates the project', function (done) {
          this.updateProject.withArgs(this.project, this.payload.sha).resolves()

          request(this.app)
            .post('/')
            .send(this.payload)
            .set('X-Hub-Signature', signPayload(this.secret, this.payload))
            .expect(202)
            .expect(() => {
              expect(this.updateProject).to.be.called
            })
            .end(done)
        })

        it('responds with 400 when the signature does not match', function (done) {
          request(this.app)
            .post('/')
            .send(this.payload)
            .set('X-Hub-Signature', 'iamnosignature')
            .expect(400)
            .end(done)
        })

        it('responds with 202 when the project update fails', function (done) {
          this.updateProject.rejects()

          request(this.app)
            .post('/')
            .send(this.payload)
            .set('X-Hub-Signature', signPayload(this.secret, this.payload))
            .expect(202)
            .end(done)
        })

        context('when the branch is not master', function () {
          beforeEach(function () {
            this.payload.branches[0].name = 'not-master'
          })

          it('responds with 202 and does not update the project', function (done) {
            request(this.app)
              .post('/')
              .send(this.payload)
              .set('X-Hub-Signature', signPayload(this.secret, this.payload))
              .expect(202)
              .expect(() => {
                expect(this.updateProject).not.to.be.called
              })
              .end(done)
          })
        })
      })

      context('for a non-configured project', function () {
        beforeEach(function () {
          this.project = {
            name: this.payload.name + '-not-configured'
          }
          this.projects.push(this.project)
        })

        it('responds with 400 and does not update the project', function (done) {
          request(this.app)
            .post('/')
            .send(this.payload)
            .set('X-Hub-Signature', signPayload(this.secret, this.payload))
            .expect(400)
            .expect(() => {
              expect(this.updateProject).not.to.be.called
            })
            .end(done)
        })
      })
    })

    context('when called with Travis state other than success', function () {
      beforeEach(function () {
        this.payload = {
          'id': 1234,
          'sha': '5678',
          'name': 'some-user/some-repo',
          'context': 'continuous-integration/travis-ci/push',
          'state': 'pending',
          'branches': [{
            'name': 'master'
          }]
        }
      })

      context('for a configured project', function () {
        beforeEach(function () {
          this.project = {
            name: this.payload.name
          }
          this.projects.push(this.project)
        })

        it('responds with 202 and does not update the project', function (done) {
          request(this.app)
            .post('/')
            .send(this.payload)
            .set('X-Hub-Signature', signPayload(this.secret, this.payload))
            .expect(202)
            .expect(() => {
              expect(this.updateProject).not.to.be.called
            })
            .end(done)
        })
      })

      context('for a non-configured project', function () {
        beforeEach(function () {
          this.project = {
            name: this.payload.name + '-not-configured'
          }
          this.projects.push(this.project)
        })

        it('responds with 400 and does not update the project', function (done) {
          request(this.app)
            .post('/')
            .send(this.payload)
            .set('X-Hub-Signature', signPayload(this.secret, this.payload))
            .expect(400)
            .expect(() => {
              expect(this.updateProject).not.to.be.called
            })
            .end(done)
        })
      })
    })

    context('when called with non-Travis success state', function () {
      beforeEach(function () {
        this.payload = {
          'id': 1234,
          'sha': '5678',
          'name': 'some-user/some-repo',
          'context': 'github/push',
          'state': 'success',
          'branches': [{
            'name': 'master'
          }]
        }
      })

      context('for a configured project', function () {
        beforeEach(function () {
          this.project = {
            name: this.payload.name
          }
          this.projects.push(this.project)
        })

        it('responds with 202 and does not update the project', function (done) {
          request(this.app)
            .post('/')
            .send(this.payload)
            .set('X-Hub-Signature', signPayload(this.secret, this.payload))
            .expect(202)
            .expect(() => {
              expect(this.updateProject).not.to.be.called
            })
            .end(done)
        })
      })

      context('for a non-configured project', function () {
        beforeEach(function () {
          this.project = {
            name: this.payload.name + '-not-configured'
          }
          this.projects.push(this.project)
        })

        it('responds with 400 and does not update the project', function (done) {
          request(this.app)
            .post('/')
            .send(this.payload)
            .set('X-Hub-Signature', signPayload(this.secret, this.payload))
            .expect(400)
            .expect(() => {
              expect(this.updateProject).not.to.be.called
            })
            .end(done)
        })
      })
    })

    context('when called with other paylods', function () {
      it('ignores pull request events', function (done) {
        this.payload = {
          'action': 'closed'
        }
        request(this.app)
          .post('/')
          .send(this.payload)
          .set('X-Hub-Signature', signPayload(this.secret, this.payload))
          .expect(400)
          .expect(() => {
            expect(this.updateProject).not.to.be.called
          })
          .end(done)
      })
    })
  })
})
