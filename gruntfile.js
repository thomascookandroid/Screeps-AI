module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-screeps');

    grunt.initConfig({
        screeps: {
            options: {
                email: 'thomascookandroid@outlook.com',
                token: 'aa19bc50-3201-4add-959b-d1fb755d1ee0',
                branch: 'main'
            },
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: 'src/',
                        src: ['**/*.{js,wasm}'],
                        flatten: true
                    }
                ]
            }
        }
    });
}
