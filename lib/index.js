var path = require('path');
var EventEmitter = require('events').EventEmitter;
var Repository = require('nodegit').Repository;
var Promise = require('promise');
var prelude = require('prelude-ls');
var promisify = require('promisify-node');
var fs = promisify('fs');
var rawFS = require('fs');
var util = require('./util');

function CommitStream(repo, gitDir) {
  this.repository = repo;
  this.gitDir = gitDir;
}
CommitStream.prototype = Object.create(EventEmitter.prototype);

CommitStream.prototype.getRefNames = function() {
  return fs.readdir(path.join(this.gitDir, 'refs/heads'))
    .then(function(names) {
      return names
        .filter(function(name) {
          return !/.lock$/.exec(name);
        }).map(function(name) {
          return 'refs/heads/' + name;
        });
    });
};

CommitStream.prototype.getState = function() {
  var self = this;
  return this.getRefNames().then(prelude.map(function(refname) {
    return self.repository.getReference(refname)
    .then(function(ref) {
      return [refname, ref.target().toString()];
    });
  }))
  .then(Promise.all)
  .then(prelude.pairsToObj);
};

CommitStream.prototype._createWatchers = function() {
  var self = this;

  var paths = ['refs/heads', 'info', '.'].map(function(p) {
    return path.join(self.gitDir, p);
  });

  this.watchers = [];
  return this.getState().then(function(state) {
    self.state = state;
    return Promise.all(paths.map(function(path) {
      return fs.stat(path).then(function(stat) {
        return rawFS.watch(path, function(event, filename) {
          self._onChange(filename);
        });
      }).catch(function() {
        return null;
      });
    })).then(function(watchers) {
      self.watchers = watchers.filter(prelude.id);
    });
  });
};

CommitStream.prototype._onChange = function(filename) {
  var self = this;
  return this.getState().then(function(newState) {
    self._stateChanged(newState);
  }).done();
};

CommitStream.prototype._stateChanged = function(newState) {
  var self = this;
  var oldState = this.state;
  this.state = newState;
  util.objForEach(newState, function(refname, newSha) {
    if (oldState[refname] != newSha) {
      self.emit('refChanged', refname, oldState[refname], newSha);
    }
  });
  util.objForEach(oldState, function(refname, oldSha) {
    if (!newState[refname] && oldSha) {
      self.emit('refChanged', refname, oldSha, null);
    }
  });
};

CommitStream.prototype.close = function() {
  this.watchers.forEach(function(watcher) {
    return watcher.close();
  });
};


function getGitDir(directory) {
  return Promise.resolve(path.join(directory, '.git'));
}

CommitStream.open = function(directory) {
  return Repository.open(directory).then(function(repo) {
    return getGitDir(directory).then(function(gitDir) {
      var cs = new CommitStream(repo, gitDir);
      return cs._createWatchers().then(function() {
        return cs;
      });
    });
  });
};

module.exports = {
  CommitStream: CommitStream
};
