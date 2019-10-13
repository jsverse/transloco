import { Rule, Tree, SchematicContext, SchematicsException, EmptyTree } from '@angular-devkit/schematics';
import {
  getTranslationsRoot,
  getTranslationFiles,
  getTranslationEntryPaths,
  hasFiles,
  getJsonFileContent,
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

export default function(options: SchemaOptions): Rule {
  return (host: Tree, context: SchematicContext) => {
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
    output.forEach(o => {
      treeSource.create(`${options.outDir}/${o.lang}.json`, JSON.stringify(o.translation, null, 2));
    });

    return treeSource;
  };
}
