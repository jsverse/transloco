import * as nodePath from 'node:path';
import * as fs from 'node:fs';

import {
  apply,
  EmptyTree,
  move,
  SchematicsException,
  source,
  Tree,
} from '@angular-devkit/schematics';

import { getJsonFileContent } from './file';

function jsonTranslationFileCreator(source: Tree, lang: string) {
  source.create(
    `${lang}.json`,
    `{}
`,
  );
}

export function createTranslateFiles(langs: string[], path: string) {
  const treeSource = new EmptyTree();
  for (const lang of langs) {
    jsonTranslationFileCreator(treeSource, lang);
  }

  return apply(source(treeSource), [move('/', path)]);
}

export function checkIfTranslationFilesExist(
  path: string,
  langs: string[],
  extension: string,
  skipThrow?: boolean,
) {
  for (const lang of langs) {
    const filePath = nodePath.resolve(`${path}/${lang}${extension}`);
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
  _: Tree,
  options: { langs: string[]; translationFilePath: string },
) {
  const extension = '.json';

  checkIfTranslationFilesExist(
    options.translationFilePath,
    options.langs,
    extension,
  );

  return createTranslateFiles(options.langs, options.translationFilePath);
}

export function getTranslationKey(prefix = '', key: string): string {
  return prefix ? `${prefix}.${key}` : key;
}

export function getTranslationFiles(
  host: Tree,
  root: string,
): { lang: string; translation: Record<string, unknown> }[] {
  const rootDir = host.getDir(root);
  return rootDir.subfiles.map((fileName) => ({
    lang: fileName.split('.')[0],
    translation: getJsonFileContent(fileName, rootDir),
  }));
}
