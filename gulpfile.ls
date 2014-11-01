require! gulp
gulp-livescript = require 'gulp-livescript'
gulp-mocha = require 'gulp-mocha'
newer = require 'gulp-newer'

gulp.task 'test', ->
  gulp.src 'test/*.ls'
    .pipe gulp-livescript {+bare}
    .pipe gulp.dest 'test/'
    .pipe gulp-mocha {}
