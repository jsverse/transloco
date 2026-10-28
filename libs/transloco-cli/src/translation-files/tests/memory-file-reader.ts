import { posix } from 'node:path';

import type { PlannedFile, TranslationFileReader } from '../shared.js';

/** The files by path, with the content they hold. */
export type MemoryFiles = Record<string, string>;

const normalize = (file: string) =>
  posix.normalize(file.replaceAll('\\', '/')).replace(/\/$/, '');

/** Serves the translation folders from memory, in the order the files were given. */
export function createMemoryReader(files: MemoryFiles): TranslationFileReader {
  const paths = Object.keys(files).map(normalize);

  return {
    listFiles: (dir) =>
      paths
        .filter((file) => posix.dirname(file) === normalize(dir))
        .map((file) => posix.basename(file)),
    listDirs: (dir) => {
      const prefix = `${normalize(dir)}/`;

      return [
        ...new Set(
          paths
            .filter((file) => file.startsWith(prefix))
            .map((file) => file.slice(prefix.length).split('/'))
            .filter((parts) => parts.length > 1)
            .map(([name]) => name),
        ),
      ];
    },
    readFile: (file) => {
      const content = files[normalize(file)];

      if (content === undefined) {
        throw new Error(`ENOENT: no such file ${file}`);
      }

      return content;
    },
  };
}

/** The files with the planned ones written over them. */
export function applyPlannedFiles(
  files: MemoryFiles,
  planned: PlannedFile[],
): MemoryFiles {
  return {
    ...files,
    ...Object.fromEntries(
      planned.map(({ path, content }) => [normalize(path), content]),
    ),
  };
}

/** The JSON a translation file is written as, which is its content byte for byte. */
export const json = (value: unknown) => JSON.stringify(value, null, 2);
