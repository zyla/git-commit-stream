assert = require 'better-assert'
{ CommitStream } = require '../lib/index'
path = require 'path'
promisify = require 'promisify-node'
exec = promisify 'child_process' .exec

describe 'CommitStream', ->
  repoPath = path.resolve 'test/repos/repo'

  before ->
    CommitStream.open(repoPath).then (cs) ~>
      @cs = cs

  after ->
    @cs.close()

  specify 'should open a repo', ->
    assert(@cs instanceof CommitStream)

  specify 'should get repo state', ->
    state <- @cs.getState().then
    assert(state['refs/heads/master'])

  specify 'should notice that a ref changed', (done) ->
    @cs.on 'refChanged', (refname, oldsha, newsha) ->
      assert(refname == 'refs/heads/master')
      done()

    exec("cd #{repoPath} && git commit --allow-empty -m 'test'")
    return
