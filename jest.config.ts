import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'node',
  clearMocks: true,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^query-string$': '<rootDir>/__mocks__/query-string.js',
  },
};

export default createJestConfig(config);
