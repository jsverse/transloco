import baseConfig from '../../eslint.config.mjs';
import { relativeImportExtensions } from '../../tools/eslint/relative-import-extensions.mjs';

export default [
  ...baseConfig,
  relativeImportExtensions,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    // Override or add rules here
    rules: {},
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    // Override or add rules here
    rules: {},
  },
  {
    files: ['**/*.js', '**/*.jsx'],
    // Override or add rules here
    rules: {},
  },
];
