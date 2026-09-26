import angularEslint from 'angular-eslint';
import baseConfig, { dependencyChecks } from '../../eslint.config.mjs';
import nx from '@nx/eslint-plugin';

export default [
  ...baseConfig,
  ...nx.configs['flat/angular'].map((config) => ({
    ...config,
    ignores: [...(config.ignores ?? []), '**/*.spec.ts'],
  })),
  {
    files: ['**/*.ts'],
    ignores: ['**/*.spec.ts'],
    processor: angularEslint.processInlineTemplates,
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@angular-eslint/no-input-rename': 'off',
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'transloco',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'transloco',
          style: 'kebab-case',
        },
      ],
    },
  },
  ...nx.configs['flat/angular-template'],
  // The bundled schematics/migrations run inside the Angular CLI, which provides these.
  dependencyChecks([
    '@angular-devkit/core',
    '@angular-devkit/schematics',
    '@angular/compiler',
    '@schematics/angular',
    'typescript',
  ]),
];
