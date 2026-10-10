import fs from 'node:fs';
import path from 'node:path';

import type { TranslationFileReader } from './shared.js';

/** Reads the translation folders from the disk, in the order of their names. */
export const nodeFileReader: TranslationFileReader = {
  listFiles: (dir) => listEntries(dir, (stats) => stats.isFile()),
  listDirs: (dir) => listEntries(dir, (stats) => stats.isDirectory()),
  readFile: (file) => fs.readFileSync(file, 'utf8'),
};

function listEntries(dir: string, keep: (stats: fs.Stats) => boolean) {
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
      return keep(fs.statSync(path.join(dir, name)));
    } catch {
      // A link that leads nowhere
      return false;
    }
  });
}
