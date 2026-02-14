module.exports = {
    testEnvironment: 'node',
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        '**/*.js',
        '**/*.mjs',
        '!**/node_modules/**',
        '!**/coverage/**',
        '!**/jest.config.js',
        '!**/bin/**',
        '!**/.eslintrc.js'
    ],
    testPathIgnorePatterns: ['/node_modules/']
};
