import angularEslint from 'angular-eslint';
import baseConfig from '../../eslint.config.mjs';
import nx from '@nx/eslint-plugin';

export default [
  ...baseConfig,
  ...nx.configs['flat/angular'],
  {
    files: ['**/*.ts'],
    processor: angularEslint.processInlineTemplates,
    rules: {},
  },
  ...nx.configs['flat/angular-template'],
];
