'use strict';

const chai = require('chai');
const expect = require('chai').expect;
const nock = require('nock');

chai.use(require('chai-as-promised'));

describe('update-github-webhook', function() {
  
  beforeEach(function() {
    this.project = {
      name: 'some-user/some-repo',
      githubWebhook: 1234
    };
    this.projects = [this.project];
    
    this.url = 'abc';
    this.githubUser = 'some-user';
    this.githubToken = 'some-token';
    
    this.update = require('./../../lib/update-github-webhook')({
      githubToken: this.githubToken,
      githubUser: this.githubUser,
      projects: this.projects
    });
  });
  
  afterEach(function() {
    nock.cleanAll();
  });
  
  it('updates the webhook with the given url', function() {
    const scope = nock('https://api.github.com')
      .patch(`/repos/${this.project.name}/hooks/${this.project.githubWebhook}`, {
        config: {
          content_type: 'json',
          url: this.url
        }
      })
      .basicAuth({
        user: this.githubUser,
        pass: this.githubToken,
      })
      .reply(200);
      
    return this.update(this.url).then(() => {
      expect(scope.isDone()).to.equal(true);
    });
  });
  
  it('rejects the promise then update fails', function() {
    nock('https://api.github.com')
      .patch(`/repos/${this.project.name}/hooks/${this.project.githubWebhook}`)
      .reply(500);
      
    return expect(this.update(this.url)).to.be.rejected;
  });
  
});