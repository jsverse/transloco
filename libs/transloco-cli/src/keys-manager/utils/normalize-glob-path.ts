import { GlobOptionsWithFileTypesFalse, sync as globSync } from 'glob';

import { pathUnixFormat } from './path.utils.js';

export function normalizedGlob(
  path: string,
  options: GlobOptionsWithFileTypesFalse = {},
) {
  // on Windows system the path will have `\` which are used a escape characters in glob
  // therefore we have to escape those for the glob to work correctly on those systems
  const normalizedPath = path.replace(/\\/g, '/');
  const defaultIgnores = [
    'node_modules/**',
    'tmp/**',
    'coverage/**',
    'dist/**',
  ];
  const customIgnores =
    typeof options.ignore === 'string'
      ? [options.ignore]
      : Array.isArray(options.ignore)
        ? options.ignore
        : [];
  const mergedOptions: GlobOptionsWithFileTypesFalse = {
    ...options,
    ignore: [...defaultIgnores, ...customIgnores],
  };

  // glob walks in whatever order the file system returns entries, sort on
  // forward-slash paths so every OS and file system yields the same order
  return globSync(normalizedPath, mergedOptions).sort((a, b) => {
    const unixA = pathUnixFormat(a);
    const unixB = pathUnixFormat(b);

    return unixA < unixB ? -1 : unixA > unixB ? 1 : 0;
  });
}
