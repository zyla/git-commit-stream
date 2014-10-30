watch = require 'watch'
path = require 'path'
{ EventEmitter } = require 'events'
{ Repository } = require 'nodegit'
Promise = require 'promise'
{ map, pairs-to-obj } = require 'prelude-ls'
promisify = require 'promisify-node'
fs = promisify 'fs'


class CommitStream extends EventEmitter
  (repo, git-dir) ~>
    @repository = repo
    @git-dir = git-dir

  getRefNames: ->
    # FIXME get actual ref names
    Promise.resolve [ 'refs/heads/master' ]

  getState: ->
    @getRefNames()
      .then map (refname) ~>
        ref <~ @repository.getReference(refname).then
        [ refname, ref.target().toString() ]
      .then Promise.all
      .then pairs-to-obj


get-git-dir = (directory) ->
  Promise.resolve path.join(directory, '.git')


CommitStream.open = (directory) ->
  repo <- Repository.open(directory).then
  git-dir <- get-git-dir(directory).then
  commitstream = new CommitStream(repo, git-dir)
  state <- commitstream.getState().then
  commitstream


module.exports = { CommitStream }
