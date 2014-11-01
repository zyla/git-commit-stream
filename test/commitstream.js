var assert = require('better-assert');
var CommitStream = require('../lib/index').CommitStream;
var path = require('path');
var promisify = require('promisify-node');
var Promise = require('promise');
var exec = require('../lib/util').execP;
var mkdirp = promisify('mkdirp');

var repoPath = path.resolve('test/repos/repo');


describe('CommitStream', function() {
  specify('should open a repo', function() {
    return openRepo(repoWithCommit).then(function(cs) {
      return assert(cs instanceof CommitStream);
    });
  });

  specify('should get repo state', function() {
    return openRepo(repoWithCommit).then(function(cs) {
      return exec("cd " + repoPath + " && git branch test").then(function() {
        return cs.getState().then(function(state) {
          assert(state['refs/heads/master']);
          assert(state['refs/heads/test']);
        });
      });
    });
  });

  specify('should notice that a ref changed', function(done) {
    openRepo(repoWithCommit).then(function(cs) {
      cs.on('refChanged', function(refname, oldsha, newsha) {
        assert(refname === 'refs/heads/master');
        return done();
      });

      exec("cd " + repoPath + " && git commit --allow-empty -m 'test'");
    });
  });

  specify('should notice ref creation', function(done) {
    openRepo(repoWithCommit).then(function(cs) {
      var masterSha = cs.state['refs/heads/master'];

      cs.on('refChanged', function(refname, oldsha, newsha) {
        assert(refname === 'refs/heads/test');
        assert(!oldsha);
        assert(newsha == masterSha);
        done();
      });

      exec("cd " + repoPath + " && git branch test");
    });
  });

  specify('should work with fresh repo', function() {
    return openRepo(freshRepo).then(function(cs) {
      return cs.getState().then(function(state) {
        assert(Object.keys(state).length === 0);
      });
    });
  });

  specify('should detect refs from info/refs after gc', function() {
    return openRepo(repoWithCommit).then(function(cs) {
      return exec("cd " + repoPath + " && git gc").then(function() {
        return cs.getState().then(function(state) {
          assert(state['refs/heads/master']);
        });
      });
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

var openedRepos = [];

afterEach(function() {
  openedRepos.forEach(function(cs) {
    cs.close();
  });
  openedRepos = [];
});

function openRepo(createFunc) {
  return mkdirp('test/repos')
    .then(function() {
      return exec('rm -rf ' + repoPath);
    }).then(function() {
      return createFunc(repoPath);
    }).then(function() {
      return CommitStream.open(repoPath);
    }).then(function(cs) {
      openedRepos.push(cs);
      return cs;
    });
}

