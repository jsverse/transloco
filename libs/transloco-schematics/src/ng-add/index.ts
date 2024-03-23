import { dirname } from 'node:path';

import {
  chain,
  mergeWith,
  Rule,
  SchematicContext,
  Tree,
} from '@angular-devkit/schematics';
import {
  getAppModulePath,
  isStandaloneApp,
} from '@schematics/angular/utility/ng-ast-utils';
import {
  findBootstrapApplicationCall,
  getMainFilePath,
} from '@schematics/angular/utility/standalone/util';
import {
  addRootImport,
  addRootProvider,
} from '@schematics/angular/utility/standalone/rules';
import { findAppConfig } from '@schematics/angular/utility/standalone/app_config';

import { stringifyList } from '../utils/array';
import { getProject, setEnvironments } from '../utils/projects';
import { checkIfTranslationFilesExist } from '../utils/translations';
import { createConfig } from '../utils/transloco';

import { Loaders, SchemaOptions } from './schema';
import { createLoaderFile } from './generators/http-loader.gen';
import {
  createTranslateFiles,
  jsonTranslationFileCreator,
} from './generators/translation-files.gen';
import { createTranslocoModule } from './generators/root-module.gen';

function updateEnvironmentBaseUrl(
  host: Tree,
  sourceRoot: string,
  defaultValue: string
) {
  const template = `$1{
  baseUrl: '${defaultValue}',`;

  setEnvironments(host, sourceRoot, (env: string) =>
    env.indexOf('baseUrl') === -1
      ? env.replace(/(environment.*=*)\{/, template)
      : env
  );
}

function resolveLoaderPath({ host, mainPath, isStandalone, modulePath }) {
  let resolved = modulePath;
  if (isStandalone) {
    const bootstrapCall = findBootstrapApplicationCall(host, mainPath);
    resolved =
      findAppConfig(bootstrapCall, host, mainPath)?.filePath || mainPath;
    resolved = dirname(resolved);
  }

  return resolved;
}

export default function (options: SchemaOptions): Rule {
  return async (
    host: Tree,
    context: SchematicContext
  ): Promise<Rule | void> => {
    const langs = options.langs.split(',').map((l) => l.trim());
    const project = getProject(host, options.project);
    const sourceRoot = project.sourceRoot ?? 'src';
    const isLib = project.projectType === 'library';
    const assetsPath = `${sourceRoot}/${options.path}`;
    const mainPath = await getMainFilePath(host, options.project);
    const isStandalone = isStandaloneApp(host, mainPath);
    const modulePath = isStandalone
      ? ''
      : dirname(getAppModulePath(host, mainPath));

    const actions = [];

    if (options.loader === Loaders.Http) {
      const loaderPath = resolveLoaderPath({
        host,
        mainPath,
        isStandalone,
        modulePath,
      });
      if (isStandalone) {
        actions.push(
          addRootProvider(
            options.project,
            ({ code, external }) =>
              code`${external('provideHttpClient', '@angular/common/http')}()`
          )
        );
      } else {
        actions.push(
          addRootImport(
            options.project,
            ({ code, external }) =>
              code`${external('HttpClientModule', '@angular/common/http')}`
          )
        );
      }

      actions.push(
        mergeWith(
          createLoaderFile({
            ssr: options.ssr,
            loaderPath,
          })
        )
      );
    }

    const hasTranslationFiles = checkIfTranslationFilesExist(
      assetsPath,
      langs,
      '.json',
      true
    );
    if (!hasTranslationFiles) {
      actions.push(
        mergeWith(
          createTranslateFiles(langs, jsonTranslationFileCreator, assetsPath)
        )
      );
    }

    if (isStandalone) {
      actions.push(
        addRootProvider(options.project, ({ code, external }) => {
          external('isDevMode', '@angular/core');
          external('TranslocoHttpLoader', './transloco-loader');

          return code`${external('provideTransloco', '@jsverse/transloco')}({
        config: { 
          availableLangs: [${stringifyList(langs)}],
          defaultLang: '${langs[0]}',
          // Remove this option if your application doesn't support changing language in runtime.
          reRenderOnLangChange: true,
          prodMode: !isDevMode(),
        },
        loader: TranslocoHttpLoader
      })`;
        })
      );
    } else {
      actions.push(
        addRootImport(
          options.project,
          ({ code, external }) =>
            code`${external('TranslocoRootModule', './transloco-root.module')}`
        ),
        mergeWith(
          createTranslocoModule({
            sourceRoot,
            isLib,
            ssr: options.ssr,
            langs,
            modulePath,
            host,
          })
        )
      );
    }

    if (options.ssr) {
      updateEnvironmentBaseUrl(host, sourceRoot, 'http://localhost:4200');
    }

    createConfig(host, langs, assetsPath);

    return chain(actions)(host, context) as any;
  };
}
