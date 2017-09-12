'use strict';

return;

const chai = require('chai');
const fs = require('fs');
const expect = require('chai').expect;
const sinon = require('sinon');

chai.use(require('sinon-chai'));

describe.only('main', function() {
  
  beforeEach(function() {
    this.projects = [{
      name: 'some-user/some-repo'
    }];
    
    this.localtunnel = sinon.spy();
    
    this.GITHUB_TOKEN = 'abcd';
    this.GITHUB_USER = 'some-user';
    this.PORT = 1234;
    
    this.app = {
      listen: sinon.spy()
    };
    this.exec = sinon.spy();
    this.openTunnel = sinon.spy();
    this.updateGitHubWebhook = sinon.spy();
    this.updateProject = sinon.spy();
    
    
    this.fnApp = sinon.stub().returns(this.app);
    this.fnOpenTunnel = sinon.stub().returns(this.openTunnel);
    this.fnUpdateGithubWebhook = sinon.stub().returns(this.updateGitHubWebhook);
    this.fnUpdateProject = sinon.stub().returns(this.updateProject);
    
    this.main = require('./../lib/main')({
      localtunnel: this.localtunnel,
      
      GITHUB_TOKEN: this.GITHUB_TOKEN,
      GITHUB_USER: this.GITHUB_USER,
      PORT: this.PORT,
      
      app: this.fnApp,
      openTunnel: this.fnOpenTunnel,
      projects: this.projects,
      updateGitHubWebhook: this.fnUpdateGithubWebhook,
      updateProject: this.fnUpdateProject
    });
  });
  
  it('calls `app` with `projects` and `updateProject`', function() {
    const matcher = sinon.match.has('projects', this.projects)
      .and(sinon.match.has('updateProject', this.updateProject));
    expect(this.fnApp)
      .to.be.calledWith(matcher);
  });
  
  it('calls `openTunnel` with `PORT` and `localtunnel`', function() {
    const matcher = sinon.match.has('port', this.PORT)
      .and(sinon.match.has('localtunnel', this.localtunnel));
    expect(this.fnOpenTunnel)
      .to.be.calledWith(matcher);
  });
  
  it('calls `updateGitHubWebhook` with `GITHUB_TOKEN`, `GITHUB_USER`, and `projects`', function() {
    const matcher = sinon.match.has('githubToken', this.GITHUB_TOKEN)
      .and(sinon.match.has('githubUser', this.GITHUB_USER))
      .and(sinon.match.has('projects', this.projects));
    expect(this.fnUpdateGithubWebhook)
      .to.be.calledWith(matcher);
  });
  
  context('when called', function() {
    
    beforeEach(function() {
      this.main();
    });
    
    it('listens to the given port', function() {
      expect(this.app.listen).to.be.calledWith(this.PORT);
    });
  });
});