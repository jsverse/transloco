import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/src/keys-manager/tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  {
    ignores: [
      '**/src/keys-manager/tests/**/src/**',
      '**/src/keys-manager/tests/buildTranslationFiles/ts-extraction/service/with-params/**',
      '**/src/keys-manager/tests/__perf_fixtures__/**',
    ],
  },
];
