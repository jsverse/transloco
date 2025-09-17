import * as nodePath from 'node:path';
import * as fs from 'node:fs';

import {
  apply,
  EmptyTree,
  move,
  SchematicsException,
  source,
  Tree,
} from '@angular-devkit/schematics';

import { getProject } from './workspace';
import { getJsonFileContent } from './file';
import { getGlobalConfig } from './transloco';

function jsonTranslationFileCreator(source: Tree, lang: string) {
  source.create(
    `${lang}.json`,
    `{}
`,
  );
}

export function createTranslateFiles(langs: string[], path: string) {
  const treeSource = new EmptyTree();
  for (const lang of langs) {
    jsonTranslationFileCreator(treeSource, lang);
  }

  return apply(source(treeSource), [move('/', path)]);
}

export function checkIfTranslationFilesExist(
  path: string,
  langs: string[],
  extension: string,
  skipThrow?: boolean,
) {
  for (const lang of langs) {
    const filePath = nodePath.resolve(`${path}/${lang}${extension}`);
    if (fs.existsSync(filePath)) {
      if (skipThrow) {
        return true;
      }
      throw new SchematicsException(
        `Translation file ${filePath} is already exist, please use --skip-creation`,
      );
    }
  }
  return false;
}

export function createTranslateFilesFromOptions(
  host: Tree,
  options: { langs: string[]; translationFilePath: string },
) {
  const extension = '.json';

  checkIfTranslationFilesExist(
    options.translationFilePath,
    options.langs,
    extension,
  );

  return createTranslateFiles(options.langs, options.translationFilePath);
}

export function getTranslationKey(prefix = '', key: string): string {
  return prefix ? `${prefix}.${key}` : key;
}

export function getTranslationsRoot(
  host: Tree,
  options: { project?: string; translationPath?: string },
): string {
  const translocoConfig = getGlobalConfig();
  if (options.translationPath) {
    return options.translationPath;
  } else if (translocoConfig && translocoConfig.rootTranslationsPath) {
    return translocoConfig.rootTranslationsPath;
  } else {
    const project = getProject(host, options.project || '');
    const rootPath = (project && project.sourceRoot) || 'src';
    return nodePath.join(rootPath, 'assets', 'i18n');
  }
}

export function getTranslationFiles(
  host: Tree,
  root: string,
): { lang: string; translation: Record<string, unknown> }[] {
  const rootDir = host.getDir(root);
  return rootDir.subfiles.map((fileName) => ({
    lang: fileName.split('.')[0],
    translation: getJsonFileContent(fileName, rootDir),
  }));
}

export function getTranslationEntryPaths(
  host: Tree,
  rootDirPath: string,
): { scope: string; path: string }[] {
  const translocoConfig = getGlobalConfig();
  if (
    translocoConfig.scopePathMap &&
    Object.keys(translocoConfig.scopePathMap).length
  ) {
    return Object.entries(translocoConfig.scopePathMap).map(
      ([scope, path]) => ({
        scope,
        path: path as string,
      }),
    );
  }

  const rootDir = host.getDir(rootDirPath);

  return rootDir.subdirs.map((subDir) => ({
    scope: subDir,
    path: nodePath.join(rootDirPath, subDir),
  }));
}
