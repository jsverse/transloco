import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import importX from 'eslint-plugin-import-x';
import jsoncEslintParser from 'jsonc-eslint-parser';
import nx from '@nx/eslint-plugin';

/**
 * Checks each project's package.json against what its build actually imports.
 * Projects that need extra ignores append `dependencyChecks([...])` to their
 * own config, which replaces these options (rule options don't merge).
 */
export function dependencyChecks(ignoredDependencies = []) {
  return {
    // Nx lints with the workspace root as the base path, a direct `eslint`
    // run from a project uses the project dir. Neither pattern matches the
    // nested `{"type": "commonjs"}` markers under libs/transloco.
    files: ['package.json', 'libs/*/package.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredDependencies,
          ignoredFiles: [
            '{projectRoot}/eslint.config.{js,cjs,mjs}',
            '{projectRoot}/vitest.config.{ts,mts}',
            '{projectRoot}/**/*.spec.ts',
            '{projectRoot}/**/test-setup.ts',
            '{projectRoot}/**/mocks.ts',
            '{projectRoot}/**/tests/**',
            '{projectRoot}/**/__perf_fixtures__/**',
          ],
          // `importHelpers` is on, so compiled output requires tslib.
          runtimeHelpers: ['tslib'],
        },
      ],
    },
    languageOptions: {
      parser: jsoncEslintParser,
    },
  };
}

export default [
  ...nx.configs['flat/base'],
  {
    settings: {
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          project: ['libs/*/tsconfig.json', 'tsconfig.base.json'],
        }),
      ],
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
  ...nx.configs['flat/typescript'],
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-unused-expressions': [
        'error',
        {
          allowShortCircuit: true,
          allowTernary: true,
          allowTaggedTemplates: true,
        },
      ],
    },
  },
  {
    ...importX.flatConfigs.recommended,
    ...importX.flatConfigs.typescript,
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      ...importX.flatConfigs.recommended.rules,
      ...importX.flatConfigs.typescript.rules,
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling'],
          'newlines-between': 'always',
        },
      ],
      'no-extra-semi': 'error',
    },
  },
  ...nx.configs['flat/javascript'],
  {
    files: ['**/*.js', '**/*.jsx'],
    rules: {
      'no-extra-semi': 'error',
    },
  },
  {
    files: [
      '**/vitest.config.ts',
      '**/vitest.config.*.ts',
      '**/vite.config.ts',
      'tools/vitest/**/*.ts',
    ],
    rules: {
      '@nx/enforce-module-boundaries': 'off',
    },
  },
  {
    files: ['**/*.spec.ts', '**/mocks.ts', '**/test-setup.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@angular-eslint/component-class-suffix': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  {
    files: ['**/types.ts', '**/helpers.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  dependencyChecks(),
];
