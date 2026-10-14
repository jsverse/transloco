import baseConfig, { dependencyChecks } from '../../eslint.config.mjs';

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
      // Inputs and expected outputs of the golden suite, kept byte for byte
      '**/tests/golden/cases/**',
    ],
  },
  // prettier: optional, loaded via a guarded dynamic import when the user has it.
  // domhandler: type-only import, installed through htmlparser2.
  // commander: peer dependency of @commander-js/extra-typings, never imported directly.
  // tslib: `importHelpers` is off, so the output never requires it.
  // @clack/prompts: nx pins another version, so the graph's installed version
  // flips between the two and the version check fails at random.
  dependencyChecks([
    'prettier',
    'domhandler',
    'commander',
    'tslib',
    '@clack/prompts',
  ]),
];
