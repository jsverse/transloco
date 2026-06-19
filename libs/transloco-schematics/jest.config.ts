import type { Config } from 'jest';

module.exports = {
  displayName: 'transloco-schematics',
  testEnvironment: 'node',
  globals: {},
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  moduleNameMapper: {
    '^ora$': '<rootDir>/../../tools/jest/ora-mock.js',
  },
  coverageDirectory: '../../coverage/libs/transloco-schematics',
  preset: '../../jest.preset.js',
} as Config;
