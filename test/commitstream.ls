assert = require 'better-assert'
{ CommitStream } = require '../lib/index'
path = require 'path'
promisify = require 'promisify-node'
Promise = require 'promise'

child_process = require('child_process')

exec = (cmd) ->
  return new Promise (fulfil, reject) ->
    child_process.exec cmd, (err, stdout, stderr) ->
      if err
        reject(err)
      else
        fulfil(stdout)


describe 'CommitStream', ->
  repoPath = path.resolve 'test/repos/repo'

  freshRepo = (path) ->
    exec "git init --template=test/template #{path}"

  makeCommit = (path, msg) ->
    exec "cd #{path} && git commit --allow-empty -m '#{msg}'"

  repoWithCommit = (path) ->
    freshRepo(path).then ->
      makeCommit(path, 'Initial commit')

  openRepo = (create) ~>
    create(repoPath).then ~>
      CommitStream.open(repoPath).then (cs) ~>
        after -> cs.close()
        return cs

  specify 'should open a repo', ->
    cs <- openRepo(repoWithCommit).then
    assert(cs instanceof CommitStream)

  specify 'should get repo state', ->
    cs <- openRepo(repoWithCommit).then
    state <- cs.getState().then
    assert(state['refs/heads/master'])

  specify 'should notice that a ref changed', (done) ->
    cs <- openRepo(repoWithCommit).then

    cs.on 'refChanged', (refname, oldsha, newsha) ->
      assert(refname == 'refs/heads/master')
      done()

    exec("cd #{repoPath} && git commit --allow-empty -m 'test'")
    return
