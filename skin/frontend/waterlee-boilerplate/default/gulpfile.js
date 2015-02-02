var gulp = require('gulp'),
    sass = require('gulp-sass'),
    minifycss = require('gulp-minify-css'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    sourcemaps = require('gulp-sourcemaps'),
    gulpif = require('gulp-if'),
    rimraf = require('gulp-rimraf'),
    imagemin = require('gulp-imagemin'),
    pngcrush = require('imagemin-pngcrush'),
    browserSync = require('browser-sync'),
    env = process.env.NODE_ENV || 'development';

// SASS tasks
gulp.task('sass', function() {
    return gulp.src('src/scss/styles.scss')
        .pipe(gulpif(env === 'development', sourcemaps.init()))
        .pipe(gulpif(env === 'development', sass({errLogToConsole: true})))
        .pipe(gulpif(env === 'development', sourcemaps.write()))
        .pipe(gulpif(env === 'production', sass({errLogToConsole: true})))
        .pipe(gulpif(env === 'production', minifycss()))
        .pipe(browserSync.reload({stream:true}))
        .pipe(gulp.dest('css'));
});

// JS tasks
gulp.task('js', function() {
    return gulp.src([
            'bower_components/modernizr/modernizr.js',
            'src/js/jquery.flexslider.js',
            'src/js/elevateZoom.js',
            'src/js/jquery.mmenu.js',
            'src/js/scripts.js'
        ])
        .pipe(gulpif(env === 'development', sourcemaps.init()))
        .pipe(gulpif(env === 'production', uglify()))
        .pipe(concat('script.js'))
        .pipe(gulpif(env === 'development', sourcemaps.write()))
        .pipe(browserSync.reload({stream:true}))
        .pipe(gulp.dest('js'));
});

//Image tasks
gulp.task('image', function () {
    return gulp.src('src/images/**/*.*')
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngcrush()]
        }))
        .pipe(gulp.dest('images'));
});

// Clean
gulp.task('clean', function() {
  return gulp
    .src(['css', 'js', 'images'], {read: false})
    .pipe(rimraf());
});

// BrowserSync
gulp.task('browser-sync', function() {
    browserSync({
        proxy: "localhost/mage191/",
        port: 8080
    });
});

// Watch
gulp.task('watch', function() {

        // Watch .scss files
        gulp.watch('src/scss/**/*.scss', ['sass']);

        // Watch .js files
        gulp.watch('src/js/**/*.js', ['js']);

        // Watch images
        //gulp.watch('src/images/**/*.*', ['image']);

});

// Default task
gulp.task('default', ['browser-sync', 'sass', 'js', 'watch'], function() {

});
