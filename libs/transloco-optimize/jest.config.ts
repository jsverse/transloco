import type { Config } from 'jest';

export default {
  displayName: 'transloco-optimize',
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
  coverageDirectory: '../../coverage/libs/transloco-optimize',
  preset: '../../jest.preset.js',
} as Config;
