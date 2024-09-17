import * as p from 'node:path';
import * as fs from 'fs';

import { SchematicsException, Tree } from '@angular-devkit/schematics';

import { TranslationFileTypes } from '../ng-add/schema';
import {
  createTranslateFiles,
  jsonTranslationFileCreator,
  typescriptTranslationFileCreator,
} from '../ng-add/generators/translation-files.gen';

export function checkIfTranslationFilesExist(
  path: string,
  langs: string[],
  extension: string,
  skipThrow?: boolean,
) {
  for (const lang of langs) {
    const filePath = p.resolve(`${path}/${lang}${extension}`);
    if (fs.existsSync(filePath)) {
      if (skipThrow) {
        return true;
      }
      throw new SchematicsException(
        `Translation file ${filePath} is already exist, please use --skip-creation`,
      );
    }
  }
  return false;
}

export function createTranslateFilesFromOptions(
  host: Tree,
  options: { translateType?: TranslationFileTypes; langs: string[] },
  translationFilePath,
) {
  const extension =
    options.translateType === TranslationFileTypes.Typescript ? '.ts' : '.json';
  const translationCreator =
    options.translateType === TranslationFileTypes.Typescript
      ? typescriptTranslationFileCreator
      : jsonTranslationFileCreator;

  checkIfTranslationFilesExist(translationFilePath, options.langs, extension);

  return createTranslateFiles(
    options.langs,
    translationCreator,
    translationFilePath,
  );
}
