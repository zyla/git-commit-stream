var Promise = require('promise');
var child_process = require('child_process');
var fs = require('fs');

exports.execP = function(cmd) {
  return new Promise(function(fulfil, reject) {
    return child_process.exec(cmd, function(err, stdout, stderr) {
      if (err) {
        return reject(err);
      } else {
        return fulfil(stdout);
      }
    });
  });
};

exports.objForEach = function(obj, f) {
  Object.keys(obj).forEach(function(key) {
    f(key, obj[key]);
  });
};

/*
 * Promosified version of fs.exists().
 */
exports.fileExists = function(path) {
  return new Promise(function(resolve, reject) {
    fs.exists(path, function(exists) {
      resolve(exists);
    });
  });
};
