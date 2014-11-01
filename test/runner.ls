promisify = require 'promisify-node'
mkdirp = promisify 'mkdirp'
Promise = require 'promise'
child_process = require('child_process')

exec = (cmd) ->
  return new Promise (fulfil, reject) ->
    child_process.exec cmd, (err, stdout, stderr) ->
      if err
        reject(err)
      else
        fulfil(stdout)

before ->
  exec 'rm -rf test/repos'
    .then -> mkdirp 'test/repos'
