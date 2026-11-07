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
  _: Tree,
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
