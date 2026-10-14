import { SchematicsException, Tree } from '@angular-devkit/schematics';
import {
  TranslationFilesError,
  type TranslationFileReader,
} from '@jsverse/transloco-cli/internal/translation-files';

/** Lets the join and split of the CLI read the translation folders of a tree. */
export function createTreeFileReader(host: Tree): TranslationFileReader {
  return {
    listFiles: (dir) => host.getDir(dir).subfiles.map(String),
    listDirs: (dir) => host.getDir(dir).subdirs.map(String),
    readFile: (file) => {
      const content = host.read(file);

      if (!content) {
        throw new SchematicsException(`Could not read ${file}`);
      }

      return content.toString('utf-8');
    },
  };
}

/** Hands a problem in the translation files over to the Angular CLI as the error of the schematic. */
export function asSchematicsException<T>(run: () => T) {
  try {
    return run();
  } catch (error) {
    if (error instanceof TranslationFilesError) {
      throw new SchematicsException(error.message);
    }

    throw error;
  }
}

export const deprecationWarning = (name: 'join' | 'split') =>
  `The "${name}" schematic is deprecated and will be removed in Transloco v10. Run "transloco ${name}" from @jsverse/transloco-cli instead.`;
