import { Rule, Tree, SchematicContext } from '@angular-devkit/schematics';
import {
  getTranslationsRoot,
  getTranslationEntryPaths,
  getTranslationFiles,
  hasFiles,
  setFileContent,
  hasSubdirs,
  getTranslationKey
} from '../utils/transloco';
import { SchemaOptions } from './schema';

function reduceTranslations(host: Tree, dirPath: string, translationJson, lang: string, key = '') {
  const dir = host.getDir(dirPath);
  if (!hasFiles(dir)) return translationJson;
  dir.subfiles
    .filter(fileName => fileName.includes(`${lang}.json`))
    .forEach(fileName => {
      if (!translationJson[key]) {
        return translationJson;
      }
      setFileContent(host, dir.path, fileName, translationJson[key]);
      delete translationJson[key];
    });
  if (hasSubdirs(dir)) {
    dir.subdirs.forEach(subDirName => {
      const subDir = dir.dir(subDirName);
      const nestedKey = getTranslationKey(key, subDirName);
      reduceTranslations(host, subDir.path, translationJson, lang, nestedKey);
    });
  }

  return translationJson;
}

export default function(options: SchemaOptions): Rule {
  return (host: Tree, context: SchematicContext) => {
    const root = getTranslationsRoot(host, options);
    const translatedFiles = getTranslationFiles(host, options.source);
    const translationEntryPaths = getTranslationEntryPaths(host, root);

    const newTranslation = {};
    translatedFiles.forEach(t => {
      newTranslation[t.lang] = translationEntryPaths.reduce((acc, path) => {
        return reduceTranslations(host, path.path, t.translation, t.lang, path.scope);
      }, t.translation);
    });

    host.getDir(root).subfiles.forEach(fileName => {
      const lang = fileName.split('.')[0];
      setFileContent(host, root, fileName, newTranslation[lang]);
    });

    return host;
  };
}
