/**
 * Renames the ESM build of `marker` to the extensions Node and TypeScript read
 * as ESM, so `build` can copy it into the package as an asset.
 *
 * The package is compiled to CommonJS because it is a Node CLI and a webpack
 * plugin, but `marker` is the only export that ends up inside an application
 * bundle. Shipping it as CommonJS makes bundlers emit interop helpers and
 * Angular warn about an optimization bailout, so `./marker` also resolves
 * through an `import` condition.
 *
 * `tsconfig.marker-esm.json` compiles the same `marker.ts` a second time with
 * `module: esnext`, which keeps the two builds from drifting. TypeScript names
 * that output `.js`/`.d.ts`, which would collide with the CommonJS emit, hence
 * this step.
 *
 * When can this be deleted? Only when the package itself goes ESM-only, i.e.
 * gains `"type": "module"`. That is a breaking change for consumers who
 * `require()` the webpack plugin, so it belongs to a major release.
 *
 * Upgrading TypeScript will not remove the need for it: TypeScript still has no
 * single-pass dual CJS/ESM emit (microsoft/TypeScript#54593 is open and
 * unscheduled), and two `tsc` passes remain the sanctioned workaround.
 * TypeScript 6/7 deprecate `amd`/`umd`/`system`/`none` modules and
 * `moduleResolution: node10`/`classic`, but explicitly keep CommonJS emit.
 *
 *   npx tsc -p libs/transloco-keys-manager/tsconfig.marker-esm.json
 *   node tools/scripts/build-marker-esm.mts
 */
import { renameSync } from 'node:fs';
import { join } from 'node:path';

const outDir = join('tmp', 'transloco-keys-manager', 'marker-esm');

for (const [from, to] of [
  ['marker.js', 'marker.mjs'],
  ['marker.d.ts', 'marker.d.mts'],
]) {
  renameSync(join(outDir, from), join(outDir, to));
}
