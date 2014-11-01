var exec = require('../lib/util').execP;
var mkdirp = require('mkdirp');

before(function() {
  return exec('rm -rf test/repos').then(function() {
    return mkdirp('test/repos');
  });
});
