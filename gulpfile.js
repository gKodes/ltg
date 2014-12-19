var gulp = require('gulp'),
    mocha = require('gulp-mocha'),
    copy = require('gulp-copy'),
    jsInclude = require('./gulp/gulp-js-include');

gulp.task('default', function() {
  gulp.src(['src/ltg.js', 'src/D.js']) // , 'src/ltg.js'
    .pipe(jsInclude(['src/includes/']))
    .pipe(gulp.dest('dist/'));
});

gulp.task('demo', ['default'], function() {
  gulp.src(['dist/**', '3rd/**']).
    pipe(gulp.dest('demo/js/'));

  gulp.src(['imports/**', 'LICENSE'])
    .pipe(copy('demo/'));
});

gulp.task('test', ['default', 'P', 'provider'], function() {
  gulp.src(['dist/**', 'vendor/**']).
    pipe(gulp.dest('tests/js/'));
});

gulp.task('P', function() {
  gulp.src(['src/P.js']) // , 'src/ltg.js'
    .pipe(jsInclude(['src/includes/']))
    .pipe(gulp.dest('dist/'));
});

gulp.task('provider', function() {
  gulp.src('src/provider.js') // , 'src/ltg.js'
    .pipe(jsInclude(['src/includes/']))
    .pipe(gulp.dest('dist/'));
});