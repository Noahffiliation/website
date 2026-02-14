module.exports = {
    testEnvironment: 'node',
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        '**/*.js',
        '!**/node_modules/**',
        '!**/coverage/**',
        '!**/jest.config.js',
        '!**/bin/**',
        '!**/.eslintrc.js'
    ],
    testPathIgnorePatterns: ['/node_modules/']
};
