import fs from 'node:fs';
import path from 'node:path';

import { escape, globSync, type Path } from 'glob';

const isWindows = process.platform === 'win32';

/**
 * The folders of tools and builds, never sources to migrate. They are only
 * left out below the input folder, an input inside one of them is still read.
 */
const ignoredFolders = new Set([
  'node_modules',
  'dist',
  'out-tsc',
  'coverage',
  '.angular',
  '.nx',
  '.git',
]);

/**
 * The files below the directory whose names end with `suffix`, as absolute
 * paths, in path order. The ones whose names end with one of `exclude` are
 * left out, so are the folders of tools and builds (`node_modules`, `dist`…).
 *
 * The pattern holds the absolute directory, which is how the symlinks are
 * followed: one at the start of the walk, and the ones below it, the files
 * included. Walking from a `cwd` follows none of them. A link below the
 * directory only counts when what it points at is inside the directory too,
 * so a migration never rewrites a file outside of it, and a file reached by
 * two paths is found once. The directory is escaped, so a name made of glob
 * syntax, `(`, `[`, `*` or `{`, is taken literally.
 *
 * The file system decides the order the glob lists a folder in, and it differs
 * between systems. The paths are sorted by code point, so the template that
 * supplies a key when two define it is the same on every system.
 */
export function findFiles(dir: string, suffix: string, exclude: string[] = []) {
  // On Windows the pattern is written with `/`, as a `\` in it would escape.
  const base = (isWindows ? dir.replace(/\\/g, '/') : dir).replace(/\/+$/, '');
  const folder = escape(base, { windowsPathsNoEscape: isWindows });
  const root = path.resolve(dir);
  const below = (p: Path) => p.fullpath().startsWith(root + path.sep);

  const files = globSync(`${folder}/**/*${suffix}`, {
    nodir: true,
    // Braces are not escaped by `escape`, and the escaped ones are mishandled
    // by the glob build that is imported, so none of them is expanded.
    nobrace: true,
    windowsPathsNoEscape: isWindows,
    ignore: {
      ignored: (p) => exclude.some((end) => p.name.endsWith(end)),
      childrenIgnored: (p) => below(p) && ignoredFolders.has(p.name),
    },
  }).sort(byPath);

  return insideOf(root, files);
}

/** The files whose real path is inside the real directory, each real file once. */
function insideOf(dir: string, files: string[]) {
  let realDir: string;

  try {
    realDir = fs.realpathSync(dir);
  } catch {
    return files;
  }

  const seen = new Set<string>();

  return files.filter((file) => {
    const real = realPath(file);

    // A dangling link or a link loop is no file to migrate.
    if (real === undefined) return false;

    const relative = path.relative(realDir, real);
    const inside =
      relative !== '..' &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative);

    if (!inside || seen.has(real)) return false;

    seen.add(real);

    return true;
  });
}

function realPath(file: string) {
  try {
    return fs.realpathSync(file);
  } catch {
    return undefined;
  }
}

/** UTF-8 sorts as the code points do, and a `\` doesn't change the order of Windows paths. */
function byPath(a: string, b: string) {
  return Buffer.compare(Buffer.from(key(a)), Buffer.from(key(b)));
}

function key(file: string) {
  return file.split(path.sep).join('/');
}
