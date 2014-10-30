promisify = require 'promisify-node'
mkdirp = promisify 'mkdirp'
exec = promisify 'child_process' .exec

before ->
  mkdirp 'test/repos'
    .then -> exec 'git init --template=test/template test/repos/repo'
    .then -> exec 'cd test/repos/repo && git commit --allow-empty -m "Initial commit"'
    .then -> exec 'git init test/repos/no-head'
