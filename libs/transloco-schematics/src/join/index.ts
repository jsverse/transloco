import {
  EmptyTree,
  Rule,
  SchematicsException,
  Tree,
} from '@angular-devkit/schematics';
import { TranslationFileFormat } from '../types';
import {
  getDefaultLang,
  getJsonFileContent,
  getTranslationEntryPaths,
  getTranslationFiles,
  getTranslationKey,
  getTranslationsRoot,
  hasFiles,
  hasSubdirs,
} from '../utils/transloco';
import { SchemaOptions } from './schema';
import { normalize } from '@angular-devkit/core';
import * as fs from 'fs-extra';

type Builder = (
  tree: Tree,
  path: string,
  content: Record<string, unknown>
) => void;

function reduceTranslations(
  host: Tree,
  dirPath: string,
  translationJson,
  lang: string,
  key = ''
) {
  const dir = host.getDir(dirPath);
  if (!hasFiles(dir) && !hasSubdirs(dir)) return translationJson;
  dir.subfiles
    .filter((fileName) => fileName.includes(`${lang}.json`))
    .forEach((fileName) => {
      if (translationJson[key]) {
        throw new SchematicsException(
          `key: ${key} already exist in translation file, please rename it and rerun the command.`
        );
      }
      translationJson[key] = getJsonFileContent(fileName, dir);
    });
  if (hasSubdirs(dir)) {
    dir.subdirs.forEach((subDirName) => {
      const subDir = dir.dir(subDirName);
      const nestedKey = getTranslationKey(key, subDirName);
      reduceTranslations(
        host,
        normalize(subDir.path).substr(1),
        translationJson,
        lang,
        nestedKey
      );
    });
  }

  return translationJson;
}

function deletePrevFiles(host: Tree, options: SchemaOptions) {
  if (fs.existsSync(options.outDir)) {
    fs.removeSync(options.outDir);
  }
}

function jsonBuilder(
  tree: Tree,
  path: string,
  content: Record<string, unknown>
) {
  tree.create(`${path}.json`, JSON.stringify(content, null, 2));
}

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

export default function (options: SchemaOptions): Rule {
  return (host: Tree) => {
    deletePrevFiles(host, options);
    const root = getTranslationsRoot(host, options);
    const defaultLang = getDefaultLang(options);
    if (options.includeDefaultLang && !defaultLang) {
      throw new SchematicsException(
        `Please specify the default project's language using --default-Lang or in transloco.config.js file.`
      );
    }
    let rootTranslations = getTranslationFiles(host, root);
    const translationEntryPaths = getTranslationEntryPaths(host, root);

    if (!options.includeDefaultLang) {
      rootTranslations = rootTranslations.filter((t) => t.lang !== defaultLang);
    }

    const output = rootTranslations.map((t) => ({
      lang: t.lang,
      translation: translationEntryPaths.reduce((acc, entryPath) => {
        return reduceTranslations(
          host,
          entryPath.path,
          t.translation,
          t.lang,
          entryPath.scope
        );
      }, t.translation),
    }));

    const treeSource = new EmptyTree();
    const builder = builderFactory(options.format);
    output.forEach((o) => {
      builder(treeSource, `${options.outDir}/${o.lang}`, o.translation);
    });

    return treeSource;
  };
}
