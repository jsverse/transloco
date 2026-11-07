import path from 'node:path';

import { defineConfig } from 'tsdown';

import pkg from './package.json' with { type: 'json' };

/**
 * The CLI ships as a bundle: an entry per `exports` subpath and the `bin`,
 * with what they share split into `chunks/`. Its `package.json` is inlined,
 * its dependencies are not.
 *
 * The chunk names have no hash, so `tests/built-bin/lazy-loading.spec.ts` can
 * name the files each command loads.
 */
const src = path.join(import.meta.dirname, 'src');

export default defineConfig({
  cwd: import.meta.dirname,
  entry: {
    index: 'src/index.ts',
    bin: 'src/bin.ts',
    'internal/keys-manager': 'src/keys-manager/index.ts',
    'internal/optimize': 'src/optimize/index.ts',
    'internal/scoped-libs': 'src/scoped-libs/index.ts',
    'internal/validator': 'src/validator/index.ts',
  },
  outDir: '../../dist/libs/transloco-cli',
  tsconfig: 'tsconfig.lib.json',
  format: 'esm',
  platform: 'node',
  target: 'node22.18',
  // `.js` and `.d.ts`, the package is `"type": "module"`.
  fixedExtension: false,
  hash: false,
  inputOptions: {
    // An entry exports what it declares and nothing else, so no chunk imports
    // `bin.js` for a module it shares with it, which would run the program.
    preserveEntrySignatures: 'strict',
  },
  outputOptions: {
    chunkFileNames: ({ facadeModuleId }) => {
      // A chunk loaded with `import()` is named after its module.
      const module = facadeModuleId && path.relative(src, facadeModuleId);

      return module && !module.startsWith('..')
        ? `chunks/${module.replace(/\.ts$/, '')}.js`
        : 'chunks/[name].js';
    },
  },
  dts: true,
  deps: {
    // Every bare specifier stays an import, whether or not it resolves.
    neverBundle: true,
    // Fails the build if anything from node_modules ends up in the bundle.
    onlyBundle: [],
    // What the output may import: the dependencies, the optional peers and
    // prettier, which the keys manager loads when the project has it.
    onlyImport: [
      ...Object.keys(pkg.dependencies),
      ...Object.keys(pkg.peerDependencies),
      'prettier',
    ],
  },
  copy: [
    'package.json',
    '*.md',
    { from: '../../LICENSE', to: '../../dist/libs/transloco-cli' },
  ],
});
