/*
  SUPPORTED TASKS
    * default ( lint )
*/

/*global module:false*/
module.exports = function(grunt) {

  // CONFIG
  grunt.initConfig({
    // lint task config
    lint: {
      files: [
        'grunt.js',
        'src/*.js',
        'src/event/*.js',
        'src/html/template.js',
        't/**/*.js'
      ]
    },

    // min task config
    min: {
        with_prototype: {
            src: ['<process_include:src/html-template-with-prototype.js>'],
            dest: 'build/html-template-with-prototype.js'
        },
        with_namespace: {
            src: ['<process_include:src/html-template-with-namespace.js>'],
            dest: 'build/html-template-with-namespace.js'
        }
    }
  });

  // Default task.
  grunt.registerTask('default', 'lint min');


  // HELPERS
  // process_include
  grunt.registerHelper('process_include',function(filepath){
    var src = grunt.file.read(filepath);
    src = src.replace(/^\/\/include<(.*)>$/mg, function(match, p1){
      return grunt.file.read(p1);
    });
    return src;
  });
};
