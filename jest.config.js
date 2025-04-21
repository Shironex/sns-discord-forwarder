module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/package.json$': '<rootDir>/package.json'
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.jest.json'
    }
  }
}; 