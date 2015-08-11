// Include gulp
var gulp = require('gulp');

// Include Our Plugins
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var inline = require('gulp-mc-inliner');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var inlinesource = require('gulp-inline-source');
var util = require('gulp-util');
var nodemailer = require('nodemailer');
var fs = require('fs');
var html_strip = require('htmlstrip-native');
var twig = require('gulp-twig');

// Include the config
var config = require('./config.json');

// Compile Our Sass
gulp.task('sass', function() {
    return gulp.src('src/scss/*.scss')
    .pipe(sass({errLogToConsole: true}))
    .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
    .pipe(gulp.dest('src/css'))
    .pipe(reload({stream:true}));
});

// BrowserSync
gulp.task('browser-sync', function() {
    browserSync({
        server: {
            baseDir: './output',
            index: config.template_file + '.html'
        },
        open: "external",
        logPrefix: "Gulp Email Creator"
    });
});

// Build our templates
gulp.task('build', function() {
    return gulp.src('src/html/' + config.template_file + '.twig')
        .pipe(twig())
        .pipe(inlinesource())
        .pipe(inline(config.APIKEY, false))
        .pipe(gulp.dest('./output'))
        .pipe(reload({stream:true}))
        .pipe(gulp.dest('./'));
});

// Build our dev templates
gulp.task('build_dev', function() {
    return gulp.src('src/html/' + config.template_file + '.twig')
        .pipe(twig())
        .pipe(gulp.dest('./output_dev'))
        .pipe(reload({stream:true}))
        .pipe(gulp.dest('./'));
});

// Watch Files For Changes
gulp.task('watch', function() {
    gulp.watch('src/scss/*.scss', ['sass']);
    gulp.watch('src/html/**/*.twig', ['build']);
    gulp.watch('src/css/*.css', ['build']);
});

// Default Task
gulp.task('default', ['sass', 'browser-sync', 'build', 'watch']);

// Add ability to send test emails
// Add ability to send test emails
gulp.task('send', function () {
    console.log(util.env.template);
    return sendEmail(util.env.template + '.html', config.testing.to);
});

gulp.task('litmus', function () {
    return sendEmail(util.env.template, config.litmus);
});

function sendEmail(template, recipient) {
    try {

        var options = {
            include_script : false,
            include_style : false,
            compact_whitespace : true,
            include_attributes : { 'alt': true }
        };

        var templatePath = "./output/" + template;

        console.log(templatePath);

        var transporter = nodemailer.createTransport({
            service: 'Mailgun',
            auth: {
                user: config.auth.mailgun.user,
                pass: config.auth.mailgun.pass
            }
        });

        var templateContent = fs.readFileSync(templatePath, encoding = "utf8");

        var mailOptions = {
            from: config.testing.from, // sender address
            to: recipient, // list of receivers
            subject: config.testing.subject + ' - ' + template, // Subject line
            html: templateContent, // html body
            text: html_strip.html_strip(templateContent, options)
        };

        transporter.sendMail(mailOptions, function(error, info){
            if(error){
                return util.log(error);
            }else{
                return util.log('Message sent: ' + info.response);
            }
        });

    } catch (e) {
        if(e.code == 'ENOENT') {
            util.log('There was an error. Check your template name to make sure it exists in ./output');
        } else if(e instanceof TypeError) {
            util.log('There was an error. Please check your config.json to make sure everything is spelled correctly');
        } else {
            util.log(e);
        }
    }
}
