/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    lint: {
      files: ['grunt.js', 'src/**/*.js']
    },
  });

  // Default task.
  grunt.registerTask('default', 'lint');

};
