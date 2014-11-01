var assert = require('better-assert');
var CommitStream = require('../lib/index').CommitStream;
var path = require('path');
var promisify = require('promisify-node');
var Promise = require('promise');
var exec = require('../lib/util').execP;

var repoPath = path.resolve('test/repos/repo');


describe('CommitStream', function() {
  specify('should open a repo', function() {
    return openRepo(repoWithCommit).then(function(cs) {
      return assert(cs instanceof CommitStream);
    });
  });

  specify('should get repo state', function() {
    return openRepo(repoWithCommit).then(function(cs) {
      return cs.getState().then(function(state) {
        return assert(state['refs/heads/master']);
      });
    });
  });

  return specify('should notice that a ref changed', function(done) {
    return openRepo(repoWithCommit).then(function(cs) {
      cs.on('refChanged', function(refname, oldsha, newsha) {
        assert(refname === 'refs/heads/master');
        return done();
      });

      exec("cd " + repoPath + " && git commit --allow-empty -m 'test'");
    });
  });
});

function freshRepo(path) {
  return exec("git init --template=test/template " + path);
}

function makeCommit(path, msg) {
  return exec("cd " + path + " && git commit --allow-empty -m '" + msg + "'");
}

function repoWithCommit(path) {
  return freshRepo(path).then(function() {
    return makeCommit(path, 'Initial commit');
  });
}

function openRepo(createFunc) {
  return createFunc(repoPath).then(function() {
    return CommitStream.open(repoPath).then(function(cs) {
      after(function() {
        return cs.close();
      });
      return cs;
    });
  });
}

