module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/tests/**/*.test.js'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.git/',
    '/coverage/',
    '/docs/',
    '/css/',
    '/resources/',
    '/tests/fixtures/',
    '/tests/expected-results/'
  ],
  collectCoverageFrom: [
    'js/**/*.js',
    '!js/**/*.min.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  verbose: true,
  testTimeout: 30000,
  maxWorkers: 1,
  cache: false,
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/docs/',
    '<rootDir>/resources/',
    '<rootDir>/css/'
  ]
};