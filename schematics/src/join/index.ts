import { Rule, Tree, SchematicContext, SchematicsException, EmptyTree } from '@angular-devkit/schematics';
import {TranslationFileFormat} from '../types';
import {
  getTranslationsRoot,
  getTranslationFiles,
  getTranslationEntryPaths,
  hasFiles,
  getJsonFileContent,
  hasSubdirs,
  getTranslationKey
} from '../utils/transloco';
import {SchemaOptions} from './schema';
const fs = require('fs-extra');

type Builder = (tree: Tree, path: string, content: Object) => void;

function reduceTranslations(host: Tree, dirPath: string, translationJson, lang: string, key = '') {
  const dir = host.getDir(dirPath);
  if (!hasFiles(dir)) return translationJson;
  dir.subfiles
    .filter(fileName => fileName.includes(`${lang}.json`))
    .forEach(fileName => {
      if (translationJson[key]) {
        throw new SchematicsException(
          `key: ${key} is already exist in translation file, please rename it and rerun the command.`
        );
      }
      translationJson[key] = getJsonFileContent(fileName, dir);
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

function deletePrevFiles(host: Tree, options: SchemaOptions) {

  if(fs.existsSync(options.outDir)) {
    fs.removeSync(options.outDir);
  }
}

const jsonBuilder: Builder = (tree: Tree, path: string, content: Object) => {
  tree.create(`${path}.json`, JSON.stringify(content, null, 2));
};

function builderFactory(format: TranslationFileFormat): Builder {
  switch (format) {
    case TranslationFileFormat.JSON:
      return jsonBuilder;
    case TranslationFileFormat.PO:
      // TODO:
      return jsonBuilder;
    case TranslationFileFormat.XLIFF:
      // TODO:
      return jsonBuilder;
    default:
      return jsonBuilder;
  }
}

export default function(options: SchemaOptions): Rule {
  return (host: Tree, context: SchematicContext) => {

    deletePrevFiles(host, options);
    const root = getTranslationsRoot(host, options);
    const rootTranslations = getTranslationFiles(host, root);
    const translationEntryPaths = getTranslationEntryPaths(host, root);

    const output = rootTranslations.map(t => ({
      lang: t.lang,
      translation: translationEntryPaths.reduce((acc, path) => {
        return reduceTranslations(host, path.path, t.translation, t.lang, path.scope);
      }, t.translation)
    }));

    const treeSource = new EmptyTree();
    const builder = builderFactory(options.format);
    output.forEach(o => {
      builder(treeSource, `${options.outDir}/${o.lang}`, o.translation);
    });

    return treeSource;
  };
}
