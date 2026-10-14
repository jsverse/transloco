import {
  EmptyTree,
  Rule,
  SchematicContext,
  Tree,
} from '@angular-devkit/schematics';
import { joinTranslations } from '@jsverse/transloco-cli/internal/translation-files';
import { existsSync, removeSync } from 'fs-extra';

import { getGlobalConfig, getTranslationsRoot } from '../../schematics-core';
import {
  asSchematicsException,
  createTreeFileReader,
  deprecationWarning,
} from '../translation-files';

import { SchemaOptions } from './schema';

function getDefaultLang(options: SchemaOptions) {
  return options.defaultLang || getGlobalConfig().defaultLang;
}

function deletePrevFiles(host: Tree, options: SchemaOptions) {
  if (existsSync(options.outDir)) {
    removeSync(options.outDir);
  }
}

export default function (options: SchemaOptions): Rule {
  return (host: Tree, context: SchematicContext) => {
    context.logger.warn(deprecationWarning('join'));
    deletePrevFiles(host, options);
    const root = getTranslationsRoot(host, options);
    const files = asSchematicsException(() =>
      joinTranslations(createTreeFileReader(host), {
        root,
        outDir: options.outDir,
        defaultLang: getDefaultLang(options),
        includeDefaultLang: options.includeDefaultLang,
        scopePathMap: getGlobalConfig().scopePathMap,
      }),
    );

    const treeSource = new EmptyTree();
    files.forEach(({ path, content }) => treeSource.create(path, content));

    return treeSource;
  };
}
