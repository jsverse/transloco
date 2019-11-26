import {
  HostTree,
  EmptyTree,
  apply,
  source,
  move,
  Source,
  SchematicsException,
  Tree
} from '@angular-devkit/schematics';
import { TranslationFileTypes } from '../ng-add/schema';
const p = require('path');
const fs = require('fs');

export function jsonTranslationFileCreator(source, lang, path) {
  return source.create(
    p.join(path, `${lang}.json`),
    `{
  "title": "transloco ${lang}",
  "dynamic": "transloco {{value}}"
}
`
  );
}

export function typescriptTranslationFileCreator(source, lang, path) {
  return source.create(
    p.join(path, `${lang}.ts`),
    `export default {
  title: "transloco ${lang}",
  dynamic: "transloco {{value}}"
};
`
  );
}

export function checkIfTranslationFilesExist(path: string, langs: string[], extension: string, skipThrow?: boolean) {
  for (let lang of langs) {
    const filePath = p.resolve(`${path}/${lang}${extension}`);
    if (fs.existsSync(filePath)) {
      if (skipThrow) {
        return true;
      }
      throw new SchematicsException(`Translation file ${filePath} is already exist, please use --skip-creation`);
    }
  }
  return false;
}

export function createTranslateFilesFromOptions(
  host: Tree,
  options: { translateType?: TranslationFileTypes; langs: string[] },
  translationFilePath
): Tree {
  const extension = options.translateType === TranslationFileTypes.Typescript ? '.ts' : '.json';
  const translationCreator =
    options.translateType === TranslationFileTypes.Typescript
      ? typescriptTranslationFileCreator
      : jsonTranslationFileCreator;

  checkIfTranslationFilesExist(translationFilePath, options.langs, extension);

  return createTranslateFiles(options.langs, translationCreator, translationFilePath);
}

export function createTranslateFiles(langs: string[], creator, path): HostTree {
  const treeSource = new EmptyTree();
  langs.forEach(lang => {
    creator(treeSource, lang, path);
  });

  return treeSource;
}
