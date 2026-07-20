module.exports = {
  displayName: 'transloco-scoped-libs',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/libs/transloco-scoped-libs',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
};
