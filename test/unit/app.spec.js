'use strict';

const chai = require('chai');
const crypto = require('crypto');
const expect = require('chai').expect;
const sinon = require('sinon');
const request = require('supertest');

chai.use(require('sinon-chai'));

const signPayload = function (secret, payload) {
  const blob = JSON.stringify(payload);
  return 'sha1=' + crypto.createHmac('sha1', secret).update(blob).digest('hex');
};

describe('app', function() {
  
  beforeEach(function() {
    this.updateProject = sinon.stub();
    this.projects = [];
    this.secret = 's3cret';
    
    this.app = require('./../../lib/app')({
      updateProject: this.updateProject,
      projects: this.projects,
      secret: this.secret
    });
  });
  
  describe('POST /', function() {
    
    context('when called with Travis success state', function() {
      
      beforeEach(function() {
        this.payload = {
          'id': 1234,
          'sha': '5678',
          'name': 'some-user/some-repo',
          'context': 'continuous-integration/travis-ci/push',
          'state': 'success',
          'branches': [{
            'name': 'master'
          }]
        };
      });
      
      context('for a configured project', function() {
        
        beforeEach(function() {
          this.project = {
            name: this.payload.name
          };
          this.projects.push(this.project);
        });
        
        it('responds with 201 and updates the project', function(done) {
          this.updateProject.withArgs(this.project, this.payload.sha).resolves();
          
          request(this.app)
            .post('/')
            .send(this.payload)
            .set('X-Hub-Signature', signPayload(this.secret, this.payload))
            .expect(201)
            .expect(() => {
              expect(this.updateProject).to.be.called;
            })
            .end(done);
        });
        
        it('responds with 401 when the signature does not match', function(done) {
          request(this.app)
            .post('/')
            .send(this.payload)
            .set('X-Hub-Signature', 'iamnosignature')
            .expect(401)
            .end(done);
        });
        
        it('responds with 500 when the project update fails', function(done) {
          this.updateProject.rejects();
          
          request(this.app)
            .post('/')
            .send(this.payload)
            .set('X-Hub-Signature', signPayload(this.secret, this.payload))
            .expect(500)
            .end(done);
        });
        
        context('when the branch is not master', function() {
          
          beforeEach(function() {
            this.payload.branches[0].name = 'not-master';
          });
          
          it('responds with 201 and does not update the project', function(done) {
            request(this.app)
              .post('/')
              .send(this.payload)
              .set('X-Hub-Signature', signPayload(this.secret, this.payload))
              .expect(201)
              .expect(() => {
                expect(this.updateProject).not.to.be.called;
              })
              .end(done);
          });
        });
      });
      
      context('for a non-configured project', function() {
        
        beforeEach(function() {
          this.project = {
            name: this.payload.name + '-not-configured'
          };
          this.projects.push(this.project);
        });
        
        it('responds with 201 and does not update the project', function(done) {
          request(this.app)
            .post('/')
            .send(this.payload)
            .set('X-Hub-Signature', signPayload(this.secret, this.payload))
            .expect(201)
            .expect(() => {
              expect(this.updateProject).not.to.be.called;
            })
            .end(done);
        });
      });
    });
      
    context('when called with Travis state other than success', function() {
      
      beforeEach(function() {
        this.payload = {
          'id': 1234,
          'sha': '5678',
          'name': 'some-user/some-repo',
          'context': 'continuous-integration/travis-ci/push',
          'state': 'pending',
          'branches': [{
            'name': 'master'
          }]
        };
      });
      
      context('for a configured project', function() {
        
        beforeEach(function() {
          this.project = {
            name: this.payload.name
          };
          this.projects.push(this.project);
        });
        
        it('responds with 201 and does not update the project', function(done) {
          request(this.app)
            .post('/')
            .send(this.payload)
            .set('X-Hub-Signature', signPayload(this.secret, this.payload))
            .expect(201)
            .expect(() => {
              expect(this.updateProject).not.to.be.called;
            })
            .end(done);
        });
      });
      
      context('for a non-configured project', function() {
        
        beforeEach(function() {
          this.project = {
            name: this.payload.name + '-not-configured'
          };
          this.projects.push(this.project);
        });
        
        it('responds with 201 and does not update the project', function(done) {
          request(this.app)
            .post('/')
            .send(this.payload)
            .set('X-Hub-Signature', signPayload(this.secret, this.payload))
            .expect(201)
            .expect(() => {
              expect(this.updateProject).not.to.be.called;
            })
            .end(done);
        });
      });
    });
      
    context('when called with non-Travis success state', function() {
      
      beforeEach(function() {
        this.payload = {
          'id': 1234,
          'sha': '5678',
          'name': 'some-user/some-repo',
          'context': 'github/push',
          'state': 'success',
          'branches': [{
            'name': 'master'
          }]
        };
      });
      
      context('for a configured project', function() {
        
        beforeEach(function() {
          this.project = {
            name: this.payload.name
          };
          this.projects.push(this.project);
        });
        
        it('responds with 201 and does not update the project', function(done) {
          request(this.app)
            .post('/')
            .send(this.payload)
            .set('X-Hub-Signature', signPayload(this.secret, this.payload))
            .expect(201)
            .expect(() => {
              expect(this.updateProject).not.to.be.called;
            })
            .end(done);
        });
      });
      
      context('for a non-configured project', function() {
        
        beforeEach(function() {
          this.project = {
            name: this.payload.name + '-not-configured'
          };
          this.projects.push(this.project);
        });
        
        it('responds with 201 and does not update the project', function(done) {
          request(this.app)
            .post('/')
            .send(this.payload)
            .set('X-Hub-Signature', signPayload(this.secret, this.payload))
            .expect(201)
            .expect(() => {
              expect(this.updateProject).not.to.be.called;
            })
            .end(done);
        });
      });
    });
    
  });
});