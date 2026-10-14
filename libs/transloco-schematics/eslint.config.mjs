import baseConfig, { dependencyChecks } from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    // Override or add rules here
    rules: {},
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': 'off',
    },
  },
  {
    files: ['**/*.js', '**/*.jsx'],
    // Override or add rules here
    rules: {},
  },
  // Schematics run inside the Angular CLI, which provides these.
  dependencyChecks([
    '@angular-devkit/core',
    '@angular-devkit/schematics',
    '@angular/cli',
    '@schematics/angular',
    'rxjs',
    'typescript',
  ]),
];
