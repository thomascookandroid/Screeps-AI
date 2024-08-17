const commonjs = require("@rollup/plugin-commonjs")
const nodeResolve = require("@rollup/plugin-node-resolve")

module.exports = (grunt) => {

    grunt.loadNpmTasks('grunt-screeps');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-rollup');

    grunt.initConfig({
        clean: {
            'dist': ['dist']
        },
        rollup: {
            options: {
                plugins: [
                    commonjs(),
                    nodeResolve()
                ],
                format: 'cjs'
            },
            files: {
                dest: 'dist/main.js',
                src: 'src/main.js'
            }
        },
        screeps: {
            options: {
                email: 'thomascookandroid@outlook.com',
                token: 'aa19bc50-3201-4add-959b-d1fb755d1ee0',
                branch: 'main'
            },
            dist: {
                src: ['dist/*.js' ]
            }
        },
    });

    grunt.registerTask('default', ['clean', 'rollup:files', 'screeps']);
}
