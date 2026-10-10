import fs from 'node:fs';
import path from 'node:path';

import type { TranslocoGlobalConfig } from '../config/index.js';
import { CliError } from '../errors.js';
import { TranslationFilesError } from '../translation-files/index.js';

/** The translations root is the option, then the config. Neither is an error. */
export function resolveTranslationsRoot(
  command: string,
  option: string | undefined,
  { rootTranslationsPath }: TranslocoGlobalConfig,
) {
  const root = option ?? rootTranslationsPath;

  if (root === undefined) {
    throw new CliError(
      `Transloco ${command}: Pass --translations-path or set rootTranslationsPath in the Transloco config.`,
    );
  }

  return root;
}

export function assertFolderExists(command: string, what: string, dir: string) {
  const stats = fs.statSync(dir, { throwIfNoEntry: false });

  if (!stats) {
    throw new CliError(
      `Transloco ${command}: The ${what} does not exist: ${dir}`,
    );
  }

  if (!stats.isDirectory()) {
    throw new CliError(
      `Transloco ${command}: The ${what} is not a folder: ${dir}`,
    );
  }
}

/** Hands a problem in the translation files over to the user as the error of the command. */
export function asCliError<T>(command: string, run: () => T) {
  try {
    return run();
  } catch (error) {
    if (error instanceof TranslationFilesError) {
      throw new CliError(`Transloco ${command}: ${error.message}`);
    }

    throw error;
  }
}

/** The names of the languages of the files, which are the names of the files. */
export const languagesOf = (files: string[]) =>
  files.map((file) => path.basename(file, '.json'));
