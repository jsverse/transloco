import { GlobOptionsWithFileTypesFalse, sync as globSync } from 'glob';

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

  return globSync(normalizedPath, mergedOptions);
}
