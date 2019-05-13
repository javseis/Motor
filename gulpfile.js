/**
* Script de gulp que realiza tareas de automatizacion
* - Comprimir CSS, JS, HTML
* - Ejecutar pruebas
* - Validar sintaxis de JS
* - Generar un reporte de complejidad ciclomatica
* - Generar documentacion de JS
*
* (c) SAT 2013, Iván González
*/

var gulp = require('gulp');

var esformatter = require('gulp-esformatter');
var autoprefix = require('gulp-autoprefixer');
var cssbeautify = require('gulp-cssbeautify');
var stripDebug = require('gulp-strip-debug');
var minifyHTML = require('gulp-minify-html');
var minifyCSS = require('gulp-minify-css');
var filesize = require('gulp-filesize');
var gulpFilter = require('gulp-filter');
var sloc = require('gulp-sloc-simply');
var notify = require("gulp-notify");
var rename = require('gulp-rename');
var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var clean = require('gulp-clean');
var gutil = require('gulp-util');
var mocha = require('gulp-mocha');
var plato = require('gulp-plato');
var jsdoc = require("gulp-jsdoc");
var gxml = require('gulp-xml2js');
var todo = require('gulp-todo');

var stylish = require('jshint-stylish');

// Limpia el directorio de construcion de este archivo gulp
gulp.task('clean', function () {
	gulp.src(['./build/'], { read: false })
		.pipe(clean())
		.pipe(notify("clean successful..."))
		.on('error', gutil.log);
});

// Ejecuta bateria de pruebas usando Mocha
gulp.task('mocha', function () {
	gulp.src('./test/test.js')
		.pipe(mocha({ reporter: 'list' }))
		.on('error', gutil.log);
});

// Realiza validaciones en los archivos js
gulp.task('jshint', function() {
	gulp.src(['./js/*.js', './js/fbhtmlcontrols/*.js'])
		.pipe(jshint())
		.pipe(jshint.reporter(stylish))
		.on('error', gutil.log);
});

// Comprime los archivos de scripts js
gulp.task('scripts', function() {
	gulp.src(['./js/fbhtmlcontrols/*.js'])
		// .pipe(concat('all.js'))
		.pipe(uglify({ mangle: false }))
		// .pipe(stripDebug())
		// .pipe(stripDebug())
		// .pipe(rename('all.min.js'))
		.pipe(gulp.dest('./build/scripts/fbhtmlcontrols/'))
		.pipe(filesize())
		.on('error', gutil.log);

	gulp.src(['./js/*.js'])
		// .pipe(concat('all.js'))
		.pipe(uglify({ mangle: false }))
		// .pipe(rename('all.min.js'))
		.pipe(gulp.dest('./build/scripts/'))
		.pipe(filesize())
		.on('error', gutil.log);
});

// Comprime los archivos HTML
gulp.task('htmlpages', function() {
	var htmlDst = './build/html/';

	gulp.src('./*.html')
		.pipe(minifyHTML())
		.pipe(gulp.dest(htmlDst))
		.on('error', gutil.log);
});

// Comprime los archivos de estilos css
gulp.task('styles', function() {
	gulp.src('./css/app.css')
		// .pipe(autoprefix('last 2 versions'))
		.pipe(minifyCSS())
		.pipe(gulp.dest('./build/styles/'))
		.on('error', gutil.log);
});

// Genera un reporte de complejidad ciclomatica
gulp.task('plato', function () {
	gulp.src(['./js/*.js', './js/fbhtmlcontrols/*.js'])
		.pipe(plato('./build/report', {
			jshint: {
				options: {
					strict: true
				}
			},
			complexity: {
				trycatch: true
			}
		}));
});

// Generar un directorio de documentacion de los archivos de scripts js
gulp.task('doc', function () {
	gulp.src(['./js/*.js', './js/fbhtmlcontrols/*.js'])
		.pipe(jsdoc('./build/documentation'))
});

// Formatea los archivos de scripts js y los copia a otro directorio
gulp.task('formatterjs', function () {
    gulp.src(['./js/*.js', './js/fbhtmlcontrols/*.js'])
        .pipe(esformatter({indent: {value: '  '}}))
        .pipe(gulp.dest('./build/jsformatter'));
});

// Convierte archivos de xml a objetos json
gulp.task('xml2js', function () {
	gulp.src('./xml/*.xml')
		.pipe(gxml())
		.pipe(gulp.dest('./build/xml2js'));
});

// Formatea los archivos de estilos css
gulp.task('css', function() {
	gulp.src('./css/app.css')
		.pipe(cssbeautify())
		.pipe(gulp.dest('./build/cssformatter'));;
});

// Genera un archivo con los TODO/FIXME de los scripts js
gulp.task('todo', function() {
    gulp.src(['./js/*.js', './js/fbhtmlcontrols/*.js'])
        .pipe(todo())
        .pipe(gulp.dest('./build/todo'));
});

gulp.task('sloc', function() {
	gulp.src(['./js/*.js', './js/fbhtmlcontrols/*.js'])
		.pipe(sloc());
});

// Tarea que se ejecuta por defatult
gulp.task('default', ['scripts', 'styles', 'todo', 'doc'], function() {
});

// Tarea que Realiza pruebas
gulp.task('test', ['mocha', 'jshint', 'plato', 'sloc'], function() {
});

// Tareas adicionales
gulp.task('alt', ['htmlpages', 'formatterjs', 'xml2js', 'css'], function() {
});
