module.exports = {
  displayName: 'schematics-core',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  moduleNameMapper: {
    '^ora$': '<rootDir>/../../tools/jest/ora-mock.js',
  },
  coverageDirectory: '../../coverage/libs/schematics-core',
};
