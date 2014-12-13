/**
 * @author Travel Track 1
 */
module.exports =
  function(grunt) {

    // Project configuration.
    grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),
      watch: {
        js: {
          files: ['package.json', 'gruntfile.js', 'server.js', 'app/**/*.js', 'lib/**/*.js', 'test/**/*.js',
            'config/**/*.json'
          ],
          tasks: ['jshint'],
          options: {
            livereload: true,
          },
        },
      },
      jshint: {
        all: {
          options: {
            curly: true,
            forin: true,
            laxbreak: true,
            '-W015': true
          },
          src: ['package.json', 'gruntfile.js', 'server.js', 'app/**/*.js', 'lib/**/*.js', 'test/**/*.js',
            'config/**/*.json'
          ],
        }
      },
      nodemon: {
        dev: {
          options: {
            file: 'server.js',
            args: [],
            ignoredFiles: [],
            watchedExtensions: ['js'],
            nodeArgs: ['--debug'],
            delayTime: 5,
            env: {
              PORT: 8088
            },
            cwd: __dirname
          }
        }
      },
      concurrent: {
        tasks: ['nodemon', 'watch'],
        options: {
          logConcurrentOutput: true
        }
      },
      mochaTest: {
        options: {
          reporter: 'spec',
        },
        src: ['test/**/*.js']
      },
      env: {
        test: {
          NODE_ENV: 'test'
        }
      },
      karma: {
        unit: {
          configFile: 'karma.conf.js'
        }
      },
      jsdoc: {
        dist: {
          src: ['*.js', 'lib/*.js', 'README.md'],
          jsdoc: 'node_modules/.bin/jsdoc',
          // jsdoc: 'node_modules/grunt-jsdoc/node_modules/jsdoc',
          options: {
            destination: 'doc',
            template: 'node_modules/ink-docstrap/template',
            // template: 'node_modules/grunt-jsdoc/node_modules/ink-docstrap/template',
            configure: 'jsdoc.conf.json'
          }
        }
      }
    });

    // Load NPM tasks
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-nodemon');
    grunt.loadNpmTasks('grunt-concurrent');
    grunt.loadNpmTasks('grunt-env');
    grunt.loadNpmTasks('grunt-jsdoc');

    // Making grunt default to force in order not to break the project.
    grunt.option('force', true);

    // Default task(s).
    grunt.registerTask('default', ['jshint', 'concurrent']);

    // Test task.
    grunt.registerTask('test', ['env:test', 'mochaTest']);

  };
