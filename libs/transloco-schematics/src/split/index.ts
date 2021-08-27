import {Rule, Tree} from '@angular-devkit/schematics';
import {TranslationFileFormat} from '../types';
import {
  getTranslationEntryPaths,
  getTranslationFiles,
  getTranslationKey,
  getTranslationsRoot,
  hasFiles,
  hasSubdirs,
  setFileContent
} from '../utils/transloco';
import {SchemaOptions} from './schema';

type Parser = (content: string) => any;

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

function parserFactory(format: TranslationFileFormat): Parser {
  switch (format) {
    case TranslationFileFormat.JSON:
      return JSON.parse;
    case TranslationFileFormat.PO:
    // TODO:
    return JSON.parse;
    case TranslationFileFormat.XLIFF:
    // TODO:
    return JSON.parse;
    default:
      return JSON.parse;
  }
}

export default function(options: SchemaOptions): Rule {
  return (host: Tree) => {
    const root = getTranslationsRoot(host, options);
    const parser = parserFactory(options.format);

    const translatedFiles = getTranslationFiles(host, options.source, parser);
    const translationEntryPaths = getTranslationEntryPaths(host, root);

    const newTranslation = {};
    for (const {lang, translation} of translatedFiles) {
      newTranslation[lang] = translationEntryPaths.reduce((acc, {scope, path}) => {
        return reduceTranslations(host, path, translation, lang, scope);
      }, translation);
    }

    host.getDir(root).subfiles.forEach(fileName => {
      const lang = fileName.split('.')[0];
      setFileContent(host, root, fileName, newTranslation[lang]);
    });

    return host;
  };
}
