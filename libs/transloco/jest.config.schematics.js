module.exports = {
  displayName: 'transloco-schematics',
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/schematics/**/*.spec.ts'],
  moduleNameMapper: {
    '^@jsverse/transloco-utils$': '<rootDir>/../transloco-utils/src/index.ts',
  },
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          target: 'es2020',
          lib: ['es2020'],
          declaration: false,
          strict: false,
          esModuleInterop: true,
          skipLibCheck: true,
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          resolveJsonModule: true,
        },
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  coverageDirectory: '../../coverage/libs/transloco-schematics',
  collectCoverageFrom: ['schematics/**/*.ts', '!schematics/**/*.spec.ts'],
};
