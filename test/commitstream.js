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

  specify('should open bare repo', function() {
    return openRepo(bareRepo).then(function(cs) {
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

  specify('should detect new commits', function(done) {
    openRepo(repoWithTestBranch).then(function(cs) {
      cs.on('newCommits', function(refname, commits) {
        assert(refname == 'refs/heads/test');
        assert(commits.length == 2);
        assert(commits[0].message().trim() == 'test 1');
        assert(commits[1].message().trim() == 'test 2');
        done();
      });

      exec("cd " + repoPath + " && git update-ref refs/heads/test master");
    });
  });

  specify('should detect deleted commits', function(done) {
    openRepo(repoWithTestBranch).then(function(cs) {
      var masterSha = cs.state['refs/heads/master'];

      cs.on('deletedCommits', function(refname, commits) {
        assert(refname == 'refs/heads/master');
        assert(commits.length == 2);
        assert(commits[0].message().trim() == 'test 2');
        assert(commits[1].message().trim() == 'test 1');
        done();
      });

      exec("cd " + repoPath + " && git reset --hard HEAD~2");
    });
  });

  specify('should detect amend', function(done) {
    openRepo(repoWithCommit).then(function(cs) {
      var newCommits = null, deletedCommits = null;

      cs.on('newCommits', function(refname, commits) {
        assert(refname == 'refs/heads/master');
        newCommits = commits;
        check();
      });

      cs.on('deletedCommits', function(refname, commits) {
        assert(refname == 'refs/heads/master');
        deletedCommits = commits;
        check();
      });

      function check() {
        if(newCommits && deletedCommits) {
          assert(newCommits.length == 1);
          assert(deletedCommits.length == 1);
          assert(newCommits[0].message().trim() == 'amended');
          assert(deletedCommits[0].message().trim() == 'Initial commit');
          done();
        }
      }

      exec("cd " + repoPath + " && git commit --allow-empty --amend -m amended");
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

function repoWithTestBranch(path) {
  return repoWithCommit(path).then(function() {
    return exec('cd ' + path + ' && git branch test');
  }).then(function() {
    return makeCommit(path, 'test 1');
  }).then(function() {
    return makeCommit(path, 'test 2');
  });
}

function bareRepo(path) {
  return exec("git --bare init --template=test/template " + path);
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

