var Promise = require('promise');
var child_process = require('child_process');

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
