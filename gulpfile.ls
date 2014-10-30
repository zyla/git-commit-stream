require! gulp
gulp-livescript = require 'gulp-livescript'
gulp-mocha = require 'gulp-mocha'
newer = require 'gulp-newer'

build = ->
  source = 'src/**.ls'
  dest = 'lib/'

  gulp.src source
    .pipe newer dest
    .pipe gulp-livescript {+bare}
    .pipe gulp.dest dest


gulp.task 'test', ->
  <- build!.on 'end'
  gulp.src 'test/*.ls'
    .pipe gulp-livescript {+bare}
    .pipe gulp.dest 'test/'
    .pipe gulp-mocha {}

gulp.task 'build', build
