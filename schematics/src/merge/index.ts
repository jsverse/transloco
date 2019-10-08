import { PathFragment } from '@angular-devkit/core';
import { Rule, Tree, SchematicContext, DirEntry, SchematicsException, EmptyTree } from '@angular-devkit/schematics';
import { from } from 'rxjs';
import { getProject } from '../utils/projects';
import { SchemaOptions } from './schema';
const glob = require('glob');

const p = require('path');

function getFileContent(fileName: PathFragment, dir: DirEntry) {
  return JSON.parse(dir.file(fileName).content.toString('utf-8'));
}

function hasSubdirs(dir: DirEntry) {
  return dir.subdirs && dir.subdirs.length;
}

function getTranslationKey(prefix = '', key) {
  return prefix ? `${prefix}.${key}` : key;
}

function reduceTranslations(host: Tree, dir: DirEntry, translationJson, lang: string, prefix = '') {
  if (!hasSubdirs(dir)) return translationJson;
  dir.subdirs.forEach(subDirName => {
    const subDir = dir.dir(subDirName);
    const key = getTranslationKey(prefix, subDirName);
    subDir.subfiles
      .filter(fileName => fileName.includes(`${lang}.json`))
      .forEach(fileName => {
        if (translationJson[key]) {
          throw new SchematicsException(
            `key: ${key} is already exist in translation file, please rename it and rerun the command.`
          );
        }
        translationJson[key] = getFileContent(fileName, subDir);
      });
    if (hasSubdirs(subDir)) {
      reduceTranslations(host, subDir, translationJson, lang, key);
    }
  });

  return translationJson;
}

function reduceTranslations2(path: string, translationJson: object, lang: string, prefix = '') {
  glob(path, {}, function(er, files) {
    console.log(files);
  });
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

function getTranslationEntryPaths(options: SchemaOptions, rootDir: string): string[] {
  if (Array.isArray(options.translationPaths)) {
    return options.translationPaths;
  } else if (typeof options.translationPaths === 'string') {
    return options.translationPaths.split(',');
  }

  return [rootDir];
}

export default function(options: SchemaOptions): Rule {
  return (host: Tree, context: SchematicContext) => {
    const path = process.cwd();
    // console.log(p.join(path, 'src/assets/**/*.json'));
    //   console.log(glob);
    // const promise = new Promise((res, rej) => {
    //
    //   glob(`**/*.ts`, {}, function(er, files) {
    //     console.log(files);
    //     console.log(er);
    //     res();
    //   });
    // });
    //console.log(a);
    const root = getTranslationsRoot(host, options);
    const rootTranslations = getRootTranslationFiles(host, root);
    const translationEntryPaths = getTranslationEntryPaths(options, root);

    const output = rootTranslations.map(t => ({
      lang: t.lang,
      translation: translationEntryPaths.reduce((acc, path) => {
        return reduceTranslations(host, host.getDir(path), t.translation, t.lang);
      }, t.translation)
    }));

    const treeSource = new EmptyTree();
    output.forEach(o => {
      treeSource.create(`${options.outDir}/${o.lang}.json`, JSON.stringify(o.translation, null, 2));
    });

    // return from(promise) as any;
    return treeSource;
  };
}
