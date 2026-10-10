import path from 'node:path';

import { escape, globSync } from 'glob';

const isWindows = process.platform === 'win32';

/**
 * The files below the directory whose names end with `suffix`, as absolute
 * paths, in path order.
 *
 * The pattern holds the absolute directory, which is how the symlinks are
 * followed: one at the start of the walk, and the ones below it, the files
 * included. Walking from a `cwd` follows none of them. The directory is
 * escaped, so a name made of glob syntax, `(`, `[`, `*` or `{`, is taken literally.
 *
 * The file system decides the order the glob lists a folder in, and it differs
 * between systems. The paths are sorted by code point, so the template that
 * supplies a key when two define it is the same on every system.
 */
export function findFiles(dir: string, suffix: string) {
  // On Windows the pattern is written with `/`, as a `\` in it would escape.
  const base = (isWindows ? dir.replace(/\\/g, '/') : dir).replace(/\/+$/, '');
  const folder = escape(base, { windowsPathsNoEscape: isWindows });

  return globSync(`${folder}/**/*${suffix}`, {
    nodir: true,
    // Braces are not escaped by `escape`, and the escaped ones are mishandled
    // by the glob build that is imported, so none of them is expanded.
    nobrace: true,
    windowsPathsNoEscape: isWindows,
  }).sort(byPath);
}

/** UTF-8 sorts as the code points do, and a `\` doesn't change the order of Windows paths. */
function byPath(a: string, b: string) {
  return Buffer.compare(Buffer.from(key(a)), Buffer.from(key(b)));
}

function key(file: string) {
  return file.split(path.sep).join('/');
}
