import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/src/lib/tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  {
    ignores: [
      '**/src/lib/tests/**/src/**',
      '**/src/lib/tests/buildTranslationFiles/ts-extraction/service/with-params/**',
      '**/src/lib/tests/__perf_fixtures__/**',
    ],
  },
];
