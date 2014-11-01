path = require 'path'
{ EventEmitter } = require 'events'
{ Repository } = require 'nodegit'
Promise = require 'promise'
{ map, pairs-to-obj, obj-to-pairs, id } = require 'prelude-ls'
promisify = require 'promisify-node'
fs = promisify 'fs'
rawFS = require('fs')


class CommitStream extends EventEmitter
  (repo, git-dir) ~>
    @repository = repo
    @git-dir = git-dir
    @_createWatchers()

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

  _createWatchers: ->
    paths = [ 'refs/heads', 'info', '.' ]
      |> map (p) ~> path.join(@git-dir, p)

    @watchers = []

    onChange = @_onChange.bind(this)

    @getState().then (state) ~>
      @state = state
      Promise.all(paths.map (path) ->
        fs.stat(path).then (stat) ->
          rawFS.watch(path, onChange)
        .catch -> return null
      ).then (watchers) ~>
        @watchers = watchers.filter(id)
    .done()

  _onChange: (filename) ->
    @getState().then (newState) ~>
      @_stateChanged(newState)
    .done()

  _stateChanged: (newState) ~>
    oldState = @state
    @state = newState
    obj-to-pairs(newState).forEach ([refname, newSha]) ~>
      if oldState[refname] !~= newSha
        @emit('refChanged', refname, oldState[refname], newSha)

    # check for deleted refs
    obj-to-pairs(oldState).forEach ([refname, oldSha]) ~>
      if !newState[refname] and oldSha
        @emit('refChanged', refname, oldSha, null)

  close: ->
    @watchers.forEach (.close())

get-git-dir = (directory) ->
  Promise.resolve path.join(directory, '.git')


CommitStream.open = (directory) ->
  repo <- Repository.open(directory).then
  git-dir <- get-git-dir(directory).then
  commitstream = new CommitStream(repo, git-dir)
  state <- commitstream.getState().then
  commitstream


module.exports = { CommitStream }
