'use strict';

const chai = require('chai');
const EventEmitter = require('events');
const expect = require('chai').expect;
const sinon = require('sinon');
const request = require('supertest');

chai.use(require('sinon-chai'));

describe('app', function() {
  
  beforeEach(function() {
    this.updateProject = sinon.stub();
    this.projects = [];
    
    this.app = require('./../../lib/app')({
      updateProject: this.updateProject,
      projects: this.projects
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
          'state': 'success'
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
            .expect(201)
            .expect(() => {
              expect(this.updateProject).to.be.called;
            })
            .end(done);
        });
        
        it('responds with 500 when the project update fails', function(done) {
          this.updateProject.rejects();
          
          request(this.app)
            .post('/')
            .send(this.payload)
            .expect(500)
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
          'state': 'pending'
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
          'state': 'success'
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