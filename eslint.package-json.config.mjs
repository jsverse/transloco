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
      'package-json/sort-properties': 'error',
      'package-json/sort-dependencies': 'error',
      'package-json/consistent-path-prefix': 'error',
      'package-json/require-engines': 'error',
    },
  },
];
