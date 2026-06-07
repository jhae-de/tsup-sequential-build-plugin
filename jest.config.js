import { createDefaultPreset } from 'ts-jest';

/** @type {import('ts-jest').JestConfigWithTsJest} */
const config = {
  ...createDefaultPreset(),
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  resetMocks: true,
  restoreMocks: true,
};

export default config;
