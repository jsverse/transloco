import type {Config} from 'jest';

export default {
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
  coverageDirectory: '../../coverage/libs/transloco-schematics',
  preset: '../../jest.preset.js',
} as Config;
