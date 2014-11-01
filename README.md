Git Commit Stream
=================

This package lets you programatically monitor changes in a Git repository.
Might be useful if you host repos on your own server, and want to do something
when there's a change.

## Example

    var CommitStream = require('git-commit-stream');
    var commitstreamPromise = CommitStream.open('/path/to/repo');

    commitstreamPromise.then(function(commitstream) {
      commitstream.on('newCommits', function(refname, commits) {
        commits.forEach(function(commit) {
          console.log('New comit arrived!');
          console.log(commit.message());
        });
      });
    });

## Command-line usage

    bin/watch-repo /path/to/repo
