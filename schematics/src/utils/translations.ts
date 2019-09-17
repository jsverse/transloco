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

export function jsonTranslationFileCreator(source, lang) {
  return source.create(
    `${lang}.json`,
    `{
  "title": "transloco ${lang}",
  "dynamic": "transloco {{value}}"
}
`
  );
}

export function typescriptTranslationFileCreator(source, lang) {
  return source.create(
    `${lang}.ts`,
    `export default {
  title: "transloco ${lang}",
  dynamic: "transloco {{value}}"
};
`
  );
}

export function checkIfTranslationFilesExist(path: string, langs: string[], extension: string) {
  langs.forEach(lang => {
    const filePath = p.resolve(`${path}/${lang}${extension}`);
    if (fs.existsSync(filePath)) {
      throw new SchematicsException(
        `Translation file ${filePath} is already exist, please use --skip-createTranslations`
      );
    }
  });
}

export function createTranslateFilesFromOptions(
  host: Tree,
  options: { translateType?: TranslationFileTypes; langs: string[] },
  translationFilePath
): Source {
  const extension = options.translateType === TranslationFileTypes.Typescript ? '.ts' : '.json';
  const translationCreator =
    options.translateType === TranslationFileTypes.Typescript
      ? typescriptTranslationFileCreator
      : jsonTranslationFileCreator;

  checkIfTranslationFilesExist(translationFilePath, options.langs, extension);

  return apply(source(createTranslateFiles(options.langs, translationCreator, extension)), [
    move('/', translationFilePath)
  ]);
}

export function createTranslateFiles(langs: string[], creator, extension): HostTree {
  const treeSource = new EmptyTree();
  langs.forEach(lang => {
    creator(treeSource, lang);
  });

  return treeSource;
}
