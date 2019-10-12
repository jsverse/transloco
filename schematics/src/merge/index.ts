import {PathFragment} from '@angular-devkit/core';
import {Rule, Tree, SchematicContext, DirEntry, SchematicsException, EmptyTree} from '@angular-devkit/schematics';
import {getProject} from '../utils/projects';
import {SchemaOptions} from './schema';
import {getConfig} from '@ngneat/utils';


const p = require('path');

function getFileContent(fileName: PathFragment, dir: DirEntry) {
  return JSON.parse(dir.file(fileName).content.toString('utf-8'));
}

function hasSubdirs(dir: DirEntry) {
  return dir.subdirs && dir.subdirs.length;
}

function hasFiles(dir: DirEntry) {
  return dir.subfiles && dir.subfiles.length;
}

function getTranslationKey(prefix = '', key) {
  return prefix ? `${prefix}.${key}` : key;
}

function reduceTranslations(host: Tree, dirPath: string, translationJson, lang: string, key = '') {
  const dir = host.getDir(dirPath);
  if (!hasFiles(dir)) return translationJson;
  dir.subfiles
    // TODO: support other formats.
    .filter(fileName => fileName.includes(`${lang}.json`))
    .forEach(fileName => {
      if (translationJson[key]) {
        throw new SchematicsException(
          `key: ${key} is already exist in translation file, please rename it and rerun the command.`
        );
      }
      translationJson[key] = getFileContent(fileName, dir);
    });
  if (hasSubdirs(dir)) {
    dir.subdirs.forEach(subDirName => {
      const subDir    = dir.dir(subDirName);
      const nestedKey = getTranslationKey(key, subDirName);
      reduceTranslations(host, subDir.path, translationJson, lang, nestedKey);
    })
  }

  return translationJson;
}

function getTranslationsRoot(host: Tree, options: SchemaOptions): string {
  const project = getProject(host, options.project);
  const rootPath = (project && project.sourceRoot) || 'src';

  return options.rootTranslationPath ? options.rootTranslationPath : p.join(rootPath, 'assets', 'i18n');
}

function getRootTranslationFiles(host: Tree, root: string): { lang: string; translation: Object }[] {
  const rootDir = host.getDir(root);
  return rootDir.subfiles.map(fileName => ({
    lang: fileName.split('.')[0],
    translation: getFileContent(fileName, rootDir)
  }));
}

function getTranslationEntryPaths(host: Tree, rootDirPath: string): {scope: string, path: string}[] {
  const translocoConfig = getConfig();
  if (translocoConfig.scopePathMap && Object.keys(translocoConfig.scopePathMap).length) {
    return Object.entries(translocoConfig.scopePathMap)
        .map(([scope, path]: [string, string]) => ({scope, path}));
  }
  const rootDir = host.getDir(rootDirPath);
  return rootDir.subdirs.map(subDir => ({scope: subDir, path: p.join(rootDirPath, subDir)}));
}

export default function(options: SchemaOptions): Rule {
  return (host: Tree, context: SchematicContext) => {

    const root = getTranslationsRoot(host, options);
    const rootTranslations = getRootTranslationFiles(host, root);
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
