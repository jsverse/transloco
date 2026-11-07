import { rm } from 'node:fs/promises';
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

/** The posix path of `file` under `src/`, or `undefined` when it's elsewhere. */
function relativeToSrc(file: string) {
  const relative = path.relative(src, file);
  const outside =
    relative === '..' ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative);

  return outside ? undefined : relative.split(path.sep).join('/');
}

export default defineConfig({
  cwd: import.meta.dirname,
  entry: {
    index: 'src/index.ts',
    bin: 'src/bin.ts',
    'internal/deprecation': 'src/deprecation/index.ts',
    'internal/keys-manager': 'src/keys-manager/index.ts',
    'internal/migrate': 'src/migrate/index.ts',
    'internal/optimize': 'src/optimize/index.ts',
    'internal/scoped-libs': 'src/scoped-libs/index.ts',
    'internal/translation-files': 'src/translation-files/index.ts',
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
      // A chunk whose only entry point is a module under `src/` is named after
      // it, e.g. `chunks/commands/validate.js` for a command loaded with
      // `import()`. The chunks shared by several modules have no such module
      // and are named after what the bundler picks, e.g. `chunks/keys-builder.js`.
      const module = facadeModuleId && relativeToSrc(facadeModuleId);

      return module
        ? `chunks/${module.replace(/\.ts$/, '')}.js`
        : 'chunks/[name].js';
    },
  },
  dts: true,
  hooks: {
    // The `bin` is not an `exports` entry, so nothing imports it for types. It
    // can't be left out of `dts`, which has no per-entry switch (its `entry`
    // picks source files, and names their declarations after the file).
    'build:done': ({ options }) =>
      rm(path.join(options.outDir, 'bin.d.ts'), { force: true }),
  },
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
