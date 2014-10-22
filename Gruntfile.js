// Generated on 2014-10-21 using generator-angular 0.9.8
'use strict';

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {

    // Configurable paths for the application
    var appConfig = {
        app: require('./bower.json').appPath || 'app',
        dist: 'dist',
        authConfig: grunt.file.readJSON('./config/auth.json')
    };

    // Define the configuration for all the tasks
    grunt.initConfig({

        // Project settings
        appConfig: appConfig,

        // Empties folders to start fresh
        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '.tmp',
                        '<%= appConfig.dist %>/{,*/}*',
                        '!<%= appConfig.dist %>/.git*'
                    ]
                }]
            },
            server: '.tmp'
        },

        // Renames files for browser caching purposes
        filerev: {
            dist: {
                src: [
                    '<%= appConfig.dist %>/scripts/{,*/}*.js',
                    '<%= appConfig.dist %>/styles/{,*/}*.css',
                    '<%= appConfig.dist %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
                    '<%= appConfig.dist %>/styles/fonts/*'
                ]
            }
        },

        firebase: {
            options: {
                //
                // reference to start with (full firebase url)
                // when downloading, the final segment in the path
                // will determine the filename where your data goes
                //
                reference: 'https://incandescent-fire-540.firebaseio.com/nl_nl',

                //
                // token is the secret key used for connecting to firebase from the server
                // this is redacted from the public repo... add a file called ./config/auth.json
                // with your token in it... { "token": "my token here" }
                //
                token: '<%= appConfig.authConfig.token %>'
            },
            getMyFiles: {
                options: {
                    mode: 'download',
                    dest: 'output/'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-firebase');

    grunt.registerTask('build', [
        'clean:dist',
        'wiredep',
        'useminPrepare',
        'concurrent:dist',
        'autoprefixer',
        'concat',
        'ngAnnotate',
        'copy:dist',
        'cdnify',
        'cssmin',
        'uglify',
        'filerev',
        'usemin',
        'htmlmin'
    ]);

    grunt.registerTask('default', ['firebase']);
};