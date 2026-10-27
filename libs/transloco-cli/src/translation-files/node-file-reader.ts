import fs from 'node:fs';
import path from 'node:path';

import type { TranslationFileReader } from './shared.js';

/** Reads the translation folders from the disk, in the order of their names. */
export const nodeFileReader: TranslationFileReader = {
  listFiles: (dir) => listEntries(dir, (stats) => stats.isFile()),
  listDirs: (dir) =>
    listEntries(
      dir,
      (stats) => stats.isDirectory(),
      // A link to the folder itself or to one above it would be walked until the OS gives up.
      (child) => !isAncestorOf(child, dir),
    ),
  readFile: (file) => fs.readFileSync(file, 'utf8'),
};

function listEntries(
  dir: string,
  keep: (stats: fs.Stats) => boolean,
  keepPath: (path: string) => boolean = () => true,
) {
  let names: string[];

  try {
    names = fs.readdirSync(dir);
  } catch (error) {
    const { code } = error as NodeJS.ErrnoException;

    if (code === 'ENOENT' || code === 'ENOTDIR') return [];

    throw error;
  }

  return names.sort().filter((name) => {
    try {
      const entry = path.join(dir, name);

      return keep(fs.statSync(entry)) && keepPath(entry);
    } catch {
      // A link that leads nowhere
      return false;
    }
  });
}

/** Whether the folder is the other one or holds it, once the links are followed. */
function isAncestorOf(candidate: string, folder: string) {
  const relative = path.relative(
    fs.realpathSync(candidate),
    fs.realpathSync(folder),
  );

  return (
    relative === '' ||
    (relative !== '..' &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative))
  );
}
