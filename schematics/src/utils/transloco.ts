import { PathFragment } from '@angular-devkit/core';
import { DirEntry, Tree } from '@angular-devkit/schematics';
import { getConfig as getTranslocoConfig, TranslocoConfig } from '@ngneat/transloco-utils';
import { getProject } from './projects';

const p = require('path');

export function getConfig() {
  return getTranslocoConfig() || {};
}

export function getJsonFileContent(fileName: PathFragment, dir: DirEntry) {
  return JSON.parse(dir.file(fileName).content.toString('utf-8'));
}

export function setFileContent(host: Tree, dirPath: string, fileName: PathFragment, content) {
  return host.overwrite(p.join(dirPath, fileName), JSON.stringify(content, null, 2));
}

export function hasSubdirs(dir: DirEntry) {
  return dir.subdirs && dir.subdirs.length;
}

export function hasFiles(dir: DirEntry) {
  return dir.subfiles && dir.subfiles.length;
}

export function getTranslationKey(prefix = '', key) {
  return prefix ? `${prefix}.${key}` : key;
}

export function getTranslationsRoot(host: Tree, options: { project: string; rootTranslationPath?: string }): string {
  const project = getProject(host, options.project);
  const rootPath = (project && project.sourceRoot) || 'src';

  return options.rootTranslationPath ? options.rootTranslationPath : p.join(rootPath, 'assets', 'i18n');
}

export function getTranslationFiles(host: Tree, root: string): { lang: string; translation: Object }[] {
  const rootDir = host.getDir(root);
  return rootDir.subfiles.map(fileName => ({
    lang: fileName.split('.')[0],
    translation: getJsonFileContent(fileName, rootDir)
  }));
}

export function getTranslationEntryPaths(host: Tree, rootDirPath: string): { scope: string; path: string }[] {
  const translocoConfig = getConfig();
  if (translocoConfig.scopePathMap && Object.keys(translocoConfig.scopePathMap).length) {
    return Object.entries(translocoConfig.scopePathMap).map(([scope, path]: [string, string]) => ({ scope, path }));
  }
  const rootDir = host.getDir(rootDirPath);
  return rootDir.subdirs.map(subDir => ({ scope: subDir, path: p.join(rootDirPath, subDir) }));
}
