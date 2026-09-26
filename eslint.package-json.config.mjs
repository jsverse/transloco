import packageJson from 'eslint-package-json';

// Runs separately from `nx lint`: these rules need the `json/json` language,
// while `@nx/dependency-checks` needs `jsonc-eslint-parser`, and ESLint parses
// each file with one language per run.
export default [
  {
    ...packageJson.configs.recommended,
    files: ['package.json', 'libs/*/package.json'],
    ignores: ['libs/vscode-snippets/package.json'],
    rules: {
      ...packageJson.configs.recommended.rules,
      'package-json/types-in-dev-dependencies': 'error',
      'package-json/no-git-dependencies': 'error',
      'package-json/no-local-dependencies': 'error',

      // Versions are pinned exactly on purpose.
      'package-json/dependency-version-range': 'off',
      // Dev dependencies live in the root package.json, not in each lib.
      'package-json/peer-dependencies-as-dev-dependencies': 'off',
      // The build sets `type` (ng-packagr: module, Node libs: commonjs).
      'package-json/prefer-type-module': 'off',
      // `repository` stays an object: npm provenance matches `repository.url`.
      'package-json/prefer-shorthand': 'off',
      // Packages publish from dist/, which only holds build output.
      'package-json/prefer-files-field': 'off',
      // ng-packagr writes `exports` into the built package.json.
      'package-json/require-entry-point': 'off',
      // The Node CLI libs expose `main`/`bin`.
      'package-json/prefer-exports': 'off',
      // Each lib under libs/ is published on its own, not nested in the root.
      'package-json/no-nested-exports': 'off',
    },
  },
];
