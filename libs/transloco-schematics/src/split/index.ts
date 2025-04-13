import { Rule, Tree } from '@angular-devkit/schematics';

import {
  getTranslationEntryPaths,
  getTranslationFiles,
  getTranslationKey,
  getTranslationsRoot,
  hasFiles,
  hasSubdirs,
  writeToJson,
} from '../../schematics-core';

import { SchemaOptions } from './schema';

function reduceTranslations(
  host: Tree,
  dirPath: string,
  translationJson,
  lang: string,
  key = '',
) {
  const dir = host.getDir(dirPath);
  if (!hasFiles(dir)) return translationJson;

  if (hasSubdirs(dir)) {
    dir.subdirs.forEach((subDirName) => {
      const subDir = dir.dir(subDirName);
      const nestedKeyPath = getTranslationKey(key, subDirName);
      const nestedKey = nestedKeyPath.split('.').at(-1);
      const subTranslationJson = translationJson[key];
      if (subTranslationJson) {
        reduceTranslations(
          host,
          subDir.path,
          subTranslationJson,
          lang,
          nestedKey,
        );
        delete translationJson[key][nestedKey];
      }
    });
  }

  dir.subfiles
    .filter((fileName) => fileName.includes(`${lang}.json`))
    .forEach((fileName) => {
      if (!translationJson[key]) {
        return translationJson;
      }
      writeToJson(host, dir.path, fileName, translationJson[key]);
    });

  delete translationJson[key];
  return translationJson;
}

export default function (options: SchemaOptions): Rule {
  return (host: Tree) => {
    const root = getTranslationsRoot(host, options);

    const translatedFiles = getTranslationFiles(host, options.source);
    const translationEntryPaths = getTranslationEntryPaths(host, root);

    const newTranslation = {};
    for (const { lang, translation } of translatedFiles) {
      newTranslation[lang] = translationEntryPaths.reduce(
        (acc, { scope, path }) => {
          return reduceTranslations(host, path, translation, lang, scope);
        },
        translation,
      );
    }

    host.getDir(root).subfiles.forEach((fileName) => {
      const lang = fileName.split('.')[0];
      writeToJson(host, root, fileName, newTranslation[lang]);
    });

    return host;
  };
}
