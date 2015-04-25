'use strict';

module.exports = function (grunt) {

    // Configurable paths for the application
    var appConfig = {
        dist: 'locales',
        authConfig: grunt.file.readJSON('./config/auth.json')
    };

    // Define the configuration for all the tasks
    grunt.initConfig({

        // Project settings
        appConfig: appConfig,

        // Renames files for browser caching purposes
        filerev: {
            options: {
                algorithm: 'md5',
                length: 8
            },
            download: {
                src: [
                    '<%= appConfig.dist %>/{,*/}*.json'
                ]
            }
        },

        firebase: {
            options: {
                // token is the secret key used for connecting to firebase from the server this is redacted from the public repo... add a file called ./config/auth.json with your token in it... { "token": "my token here" }
                token: '<%= appConfig.authConfig.token %>',
                mode: 'download',
                dest: '<%= appConfig.dist %>/'
            },
            nl_nl: {
                options: {
                    // reference to start with (full firebase url) when downloading, the final segment in the path will determine the filename where your data goes
                    reference: 'https://incandescent-fire-540.firebaseio.com/saeco/nl_nl',
                }
            },
            de_de: {
                options: {
                    reference: 'https://incandescent-fire-540.firebaseio.com/saeco/de_de',
                }
            },
            en_gb: {
                options: {
                    reference: 'https://incandescent-fire-540.firebaseio.com/saeco/en_gb',
                }
            },
            en_us: {
                options: {
                    reference: 'https://incandescent-fire-540.firebaseio.com/saeco/en_us',
                }
            },
            ru_ru: {
                options: {
                    reference: 'https://incandescent-fire-540.firebaseio.com/saeco/ru_ru',
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-newer');
    grunt.loadNpmTasks('grunt-filerev');
    grunt.loadNpmTasks('grunt-firebase');

    grunt.registerTask('default', ['firebase', 'newer:filerev']);
};