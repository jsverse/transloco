import path from 'node:path';

import { isDirectory } from '../keys-manager/utils/validators.utils.js';

/**
 * The translations folder `ng add @jsverse/transloco` picks, see
 * `detectAssetsPath` of its schematic: `public/i18n` when there is a `public`
 * folder, the Angular 18+ layout, `<source root>/assets/i18n` when the source
 * root has an `assets` folder, and else the one of the Angular version in
 * `package.json`, `public/i18n` from 18 on.
 */
export function detectTranslationsPath(
  sourceRoot: string,
  manifest: string | undefined,
): string {
  const assets = path.posix.join(sourceRoot, 'assets');

  if (isDirectory('public')) return 'public/i18n';

  if (isDirectory(assets)) return `${assets}/i18n`;

  return angularMajor(manifest) >= 18 ? 'public/i18n' : `${assets}/i18n`;
}

/** The major version `@angular/core` is asked for in, `0` when it can't be told. */
function angularMajor(manifest: string | undefined): number {
  try {
    const { dependencies, devDependencies } = JSON.parse(manifest ?? '');
    const version =
      dependencies?.['@angular/core'] ?? devDependencies?.['@angular/core'];
    // The first number of the range, as in `20`, `^20.1.0` or `>=18 <21`
    const major = typeof version === 'string' && version.match(/\d+/);

    return major ? Number(major[0]) : 0;
  } catch {
    return 0;
  }
}
