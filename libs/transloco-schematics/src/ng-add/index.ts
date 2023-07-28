import {chain, mergeWith, Rule, SchematicContext, Tree,} from '@angular-devkit/schematics';
import {stringifyList} from '../utils/array';
import {getProject, setEnvironments} from '../utils/projects';
import {checkIfTranslationFilesExist} from '../utils/translations';
import {createConfig} from '../utils/transloco';
import {Loaders, SchemaOptions} from './schema';
import {getAppModulePath, isStandaloneApp} from "../utils/ng-schematics-utils/ng-ast-utils";
import {findBootstrapApplicationCall, getMainFilePath} from "../utils/ng-schematics-utils/standalone/util";
import {addRootProvider} from "../utils/ng-schematics-utils/standalone";
import {createLoaderFile} from "./generators/http-loader.gen";
import {createTranslateFiles, jsonTranslationFileCreator} from "./generators/translation-files.gen";
import {createTranslocoModule} from "./generators/root-module.gen";
import * as _path from 'node:path';
import {findAppConfig} from "../utils/ng-schematics-utils/standalone/app_config";

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

function resolveLoaderPath({host, mainPath, isStandalone, modulePath}) {
    let resolved = modulePath;
    if (isStandalone) {
        const bootstrapCall = findBootstrapApplicationCall(host, mainPath);
        resolved =  findAppConfig(bootstrapCall, host, mainPath)?.filePath || mainPath;
        resolved = _path.dirname(resolved);
    }

    return resolved;
}

export default function (options: SchemaOptions): Rule {
  return async (host: Tree, context: SchematicContext): Promise<Rule | void> => {
    const langs = options.langs.split(',').map((l) => l.trim());
    const project = getProject(host, options.project);
    const sourceRoot = project.sourceRoot ?? 'src';
    const isLib = project.projectType === 'library';
    const assetsPath = `${sourceRoot}/${options.path}`;
    const mainPath = await getMainFilePath(host, options.project);
    const isStandalone = isStandaloneApp(host, mainPath);
    const modulePath = isStandalone ? '' : _path.dirname(getAppModulePath(host, mainPath));

    const actions = [];

    if (options.loader === Loaders.Http) {
      const loaderPath = resolveLoaderPath({host, mainPath,isStandalone,modulePath});
      if (isStandalone) {
        actions.push(
            addRootProvider(
                options.project,
                ({code, external}) => code`${external('provideHttpClient', '@angular/common/http')}()`
            )
        );
      } else {
        actions.push(
            addRootProvider(
                options.project,
                ({code, external}) => code`${external('HttpClientModule', '@angular/common/http')}`
            )
        );
      }

      actions.push(
          mergeWith(createLoaderFile({
            ssr: options.ssr,
            loaderPath
          }))
      )
    }

    const hasTranslationFiles = checkIfTranslationFilesExist(assetsPath, langs, '.json', true);
    if(!hasTranslationFiles) {
      actions.push(mergeWith(createTranslateFiles(langs, jsonTranslationFileCreator, assetsPath)));
    }

    if (isStandalone) {
      actions.push(
          addRootProvider(
              options.project,
              ({code, external}) => {
                external('isDevMode', '@angular/core');
                external('TranslocoHttpLoader', './transloco-loader.ts');

                return code`${external('provideTransloco', '@ngneat/transloco')}({
        config: { 
          availableLangs: [${stringifyList(langs)}],
          defaultLang: '${langs[0]}',
          // Remove this option if your application doesn't support changing language in runtime.
          reRenderOnLangChange: true,
          prodMode: !isDevMode(),
        },
        loader: TranslocoHttpLoader
      })`
              }
          ),
      );
    } else {
      actions.push(
          addRootProvider(
              options.project,
              ({code, external}) => code`${external('TranslocoRootModule', './transloco-root.module')}`
          ),
          mergeWith(
              createTranslocoModule({
                sourceRoot,
                isLib,
                ssr: options.ssr,
                langs,
                modulePath,
                host
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
