import type { Config } from 'jest';

export default {
  displayName: 'transloco-schematics',
  testEnvironment: 'node',
  preset: '../../jest.preset.js',
  globals: {},
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  testMatch: ['<rootDir>/schematics/**/*.spec.ts'],
  moduleNameMapper: {
    '^@jsverse/transloco-utils$': '<rootDir>/../transloco-utils/src/index.ts',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/libs/transloco-schematics',
  collectCoverageFrom: ['schematics/**/*.ts', '!schematics/**/*.spec.ts'],
} as Config;
