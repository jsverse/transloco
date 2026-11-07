/**
 * For the deprecated shims of `@jsverse/transloco-cli` (keys-manager,
 * validator, optimize and scoped-libs): ES modules that `@nx/js:tsc` builds
 * file by file, with `module: esnext` + `moduleResolution: bundler`, and that
 * Node.js runs as built. The CLI itself is bundled, so its sources don't need
 * this.
 *
 * `@nx/js:tsc` maps `@jsverse/transloco-cli` to its dist folder for them, a
 * mapping TypeScript doesn't resolve under `nodenext`, so they can't use it.
 * Under `bundler` it resolves, but TypeScript no longer insists on the
 * extension of a relative import, while Node.js fails on an import without
 * one. This rule takes that check over.
 */
const relative = '/^\\.\\.?(\\x2F|$)/';
const withExtension = '/\\.(m?js|json)$/';

const message =
  "A relative import needs its file extension ('./file.js'). This package is an ES module that Node.js runs as built, and its build doesn't check it (moduleResolution: bundler).";

export const relativeImportExtensions = {
  files: ['**/*.ts', '**/*.mts'],
  // Specs and Vitest configs go through Vite, which resolves them either way.
  ignores: ['**/*.spec.ts', '**/vitest.config*.ts'],
  rules: {
    'no-restricted-syntax': [
      'error',
      ...[
        'ImportDeclaration',
        'ExportNamedDeclaration',
        'ExportAllDeclaration',
        'ImportExpression',
      ].map((type) => ({
        selector: `${type}[source.value=${relative}]:not([source.value=${withExtension}])`,
        message,
      })),
      {
        // import(`./file`), a template literal without an interpolation
        selector: `ImportExpression[source.expressions.length=0][source.quasis.0.value.cooked=${relative}]:not([source.quasis.0.value.cooked=${withExtension}])`,
        message,
      },
    ],
  },
};
