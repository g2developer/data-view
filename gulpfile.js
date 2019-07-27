// Include gulp
var pkg = require('./package.json');
var gulp = require('gulp');

// Include Plugins
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var header = require('gulp-header');
var replace = require('gulp-replace');
var concat = require('gulp-concat');

// Lint Task
gulp.task('lint', function() {
    return gulp.src('src/js/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

var now = new Date();
var mm = now.getMonth() + 1;
var dd = now.getDate();
var res = now.getFullYear() + ((mm>9 ? '' : '0') + mm) + ((dd>9 ? '' : '0') + dd);
var version = '.' + res;

var minFileLicense = '/**\n'
                    +' * data-view' + version + '.min.js\n'
                    +' * ISC license\n'
                    +' * Copyright (c) 2018 data-view (http://dataview.tistory.com)\n'
                    +' */\n';

// Concatenate & Minify JS
gulp.task('scripts', function() {
    return gulp.src('src/js/*.js')
        .pipe(replace('#date#', res))
		.pipe(concat('all.js'))
        .pipe(gulp.dest('dist'))
        .pipe(rename('data-view'+version+'.js'))
        .pipe(gulp.dest('dist'))
        .pipe(rename('data-view.min.js'))
        .pipe(uglify({mangle:true}))
        .pipe(header(minFileLicense))
        .pipe(gulp.dest('dist'))
        .pipe(rename('data-view'+version+'.min.js'))
        .pipe(gulp.dest('dist'));
});


// Watch Files For Changes
//gulp.task('watch', function() {
//    gulp.watch('js/*.js', ['lint', 'scripts']);
//});

// Default Task
gulp.task('default', ['lint', 'scripts']);
