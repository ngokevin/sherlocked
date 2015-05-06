var autoprefixer = require('gulp-autoprefixer');
var browserify = require('browserify');
var concat = require('gulp-concat');
var gulp = require('gulp');
var reactify = require('reactify');
var stylus = require('gulp-stylus');
var uglify = require('gulp-uglify');
var vinylBuffer = require('vinyl-buffer');
var vinylSource = require('vinyl-source-stream');
var watchify = require('watchify');
var webserver = require('gulp-webserver');


var bundler = browserify('./js/app.js', watchify.args)
    .transform(reactify);


gulp.task('css', function() {
    gulp.src(['css/*.styl'])
        .pipe(stylus({compress: true}))
        .pipe(autoprefixer())
        .pipe(concat('bundle.css'))
        .pipe(gulp.dest('build'));
});


function jsBundle(bundler) {
    var bundle = bundler
        .bundle()
        .pipe(vinylSource('bundle.js'));

    if (process.env.NODE_ENV == 'production') {
        bundle = bundle
            .pipe(vinylBuffer())
            .pipe(uglify());
    }

    return bundle.pipe(gulp.dest('build'));
}


gulp.task('js', function() {
    return jsBundle(bundler);
});


gulp.task('serve', function() {
    return gulp.src(['./'])
        .pipe(webserver({
            fallback: 'index.html',
            port: process.env.SHERLOCKED_CLIENT_PORT || '2118'
        }));
});

gulp.task('watch', function() {
    bundler.on('update', function() {
        jsBundle(watchify(bundler))
    });
    bundler.on('log', console.log);

    gulp.watch('css/**/*.styl', ['css']);
});


gulp.task('build', ['css', 'js']);
gulp.task('default', ['js', 'serve', 'watch']);
