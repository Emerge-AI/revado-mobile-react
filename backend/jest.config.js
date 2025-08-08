/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'mjs'],
  transform: {},
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/**/*.test.js'
  ],
  collectCoverageFrom: [
    'routes/**/*.js',
    'middleware/**/*.js',
    'database/**/*.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 15000,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};