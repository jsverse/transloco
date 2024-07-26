import * as p from 'node:path';

import { PathFragment } from '@angular-devkit/core';
import { DirEntry, Tree } from '@angular-devkit/schematics';
import { TranslocoGlobalConfig } from '@jsverse/transloco-utils';

import { SchemaOptions } from '../join/schema';
import { CONFIG_FILE, generateConfigFile } from '../schematics.utils';

import { getProject } from './projects';
import { getConfig } from './config';

export function createConfig(
  host: Tree,
  langs: string[],
  rootTranslationsPath = 'assets/i18n/',
) {
  if (!host.get(CONFIG_FILE)) {
    host.create(
      CONFIG_FILE,
      generateConfigFile({
        rootTranslationsPath: rootTranslationsPath,
        langs,
        keysManager: {},
      }),
    );
  }
}

export function updateConfig(host: Tree, config: TranslocoGlobalConfig) {
  const originalConfig = getConfig();
  if (!originalConfig || Object.keys(originalConfig).length === 0) {
    return createConfig(host, config.langs, config.rootTranslationsPath);
  }
  host.overwrite(
    CONFIG_FILE,
    generateConfigFile({ ...config, ...originalConfig }),
  );
}

export function getJsonFileContent(
  fileName: PathFragment,
  dir: DirEntry,
  parser = JSON.parse,
) {
  return parser(dir.file(fileName).content.toString('utf-8'));
}

export function setFileContent(
  host: Tree,
  dirPath: string,
  fileName: PathFragment,
  content,
) {
  return host.overwrite(
    p.join(dirPath, fileName),
    JSON.stringify(content, null, 2),
  );
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

export function getTranslationsRoot(
  host: Tree,
  options: { project?: string; translationPath?: string },
): string {
  const translocoConfig = getConfig();
  if (options.translationPath) {
    return options.translationPath;
  } else if (translocoConfig && translocoConfig.rootTranslationsPath) {
    return translocoConfig.rootTranslationsPath;
  } else {
    const project = getProject(host, options.project);
    const rootPath = (project && project.sourceRoot) || 'src';
    return p.join(rootPath, 'assets', 'i18n');
  }
}

export function getTranslationFiles(
  host: Tree,
  root: string,
  parser?,
): { lang: string; translation: Record<string, unknown> }[] {
  const rootDir = host.getDir(root);
  return rootDir.subfiles.map((fileName) => ({
    lang: fileName.split('.')[0],
    translation: getJsonFileContent(fileName, rootDir, parser),
  }));
}

export function getTranslationEntryPaths(
  host: Tree,
  rootDirPath: string,
): { scope: string; path: string }[] {
  const translocoConfig = getConfig();
  if (
    translocoConfig.scopePathMap &&
    Object.keys(translocoConfig.scopePathMap).length
  ) {
    return Object.entries(translocoConfig.scopePathMap).map(
      ([scope, path]: [string, string]) => ({
        scope,
        path,
      }),
    );
  }
  const rootDir = host.getDir(rootDirPath);
  return rootDir.subdirs.map((subDir) => ({
    scope: subDir,
    path: p.join(rootDirPath, subDir),
  }));
}

export function getDefaultLang(options: SchemaOptions) {
  return options.defaultLang || getConfig().defaultLang;
}
