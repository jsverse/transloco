import { join, dirname } from 'node:path';

import { dasherize } from '@angular-devkit/core/src/utils/strings';
import {
  Rule,
  Tree,
  SchematicContext,
  externalSchematic,
  mergeWith,
  empty,
  chain,
} from '@angular-devkit/schematics';
import { ScriptTarget, createSourceFile } from 'typescript';
import {
  addProviderToModule,
  insertImport,
  addImportToModule,
} from '@schematics/angular/utility/ast-utils';
import { applyChangesToFile } from '@schematics/angular/utility/standalone/util';
import { Change } from '@schematics/angular/utility/change';

import { LIB_NAME } from '../schematics.utils';
import { coerceArray, stringifyList } from '../utils/array';
import { findModuleFromOptions } from '../utils/find-module';
import { getProject, getProjectPath } from '../utils/projects';
import { createTranslateFilesFromOptions } from '../utils/translations';
import { getConfig } from '../utils/config';

import { SchemaOptions } from './schema';

function getProviderValue(options: SchemaOptions) {
  const name = dasherize(options.name);
  if (!options.inlineLoader) return `'${name}'`;
  return `{ scope: '${name}', loader }`;
}

function addScopeToModule(
  tree: Tree,
  modulePath: string,
  options: SchemaOptions,
) {
  const module = tree.read(modulePath);

  const moduleSource = createSourceFile(
    modulePath,
    module.toString('utf-8'),
    ScriptTarget.Latest,
    true,
  );
  const provider = `provideTranslocoScope(${getProviderValue(options)})`;
  const changes: Change[] = [];
  changes.push(
    addProviderToModule(moduleSource, modulePath, provider, LIB_NAME)[0],
  );
  changes.push(
    addImportToModule(moduleSource, modulePath, 'TranslocoModule', LIB_NAME)[0],
  );
  changes.push(
    insertImport(
      moduleSource,
      modulePath,
      'provideTranslocoScope, TranslocoModule',
      LIB_NAME,
    ),
  );
  if (options.inlineLoader) {
    changes.push(
      insertImport(moduleSource, modulePath, 'loader', './transloco.loader'),
    );
  }

  applyChangesToFile(tree, modulePath, changes);
}

function getTranslationFilesFromAssets(host, translationsPath) {
  const langFiles = host.root.dir(translationsPath as any).subfiles;
  return Array.from(new Set(langFiles.map((file) => file.split('.')[0])));
}

function getTranslationFiles(options, host, translationsPath): string[] {
  return (
    options.langs ||
    getConfig().langs ||
    getTranslationFilesFromAssets(host, translationsPath)
  );
}

function addInlineLoader(
  tree: Tree,
  modulePath: string,
  name: string,
  langs: string | string[],
) {
  const loader = `export const loader = [${stringifyList(
    coerceArray(langs),
  )}].reduce((acc: any, lang: string) => {
  acc[lang] = () => import(\`./i18n/\${lang}.json\`);
  return acc;
}, {});

`;
  const path = join(dirname(modulePath), 'transloco.loader.ts');
  tree.create(path, loader);
}

function createTranslationFiles(options, rootPath, modulePath, host: Tree) {
  if (options.skipCreation) {
    return empty();
  }
  const defaultPath = options.inlineLoader
    ? join(dirname(modulePath), 'i18n')
    : join(rootPath, 'assets', 'i18n', dasherize(options.name));
  const translationsPath = options.translationPath
    ? join(rootPath, options.translationPath)
    : defaultPath;

  return createTranslateFilesFromOptions(host, options, translationsPath);
}

function extractModuleOptions({
  path,
  project,
  routing,
  flat,
  commonModule,
}: SchemaOptions) {
  return { path, project, routing, flat, commonModule };
}

export default function (options: SchemaOptions): Rule {
  return (host: Tree, context: SchematicContext) => {
    const project = getProject(host, options.project);
    const rootPath = project?.sourceRoot ?? 'src';
    const assetsPath = join(rootPath, 'assets', 'i18n');
    options.langs = getTranslationFiles(options, host, assetsPath);
    if (options.module) {
      const projectPath = getProjectPath(host, project, options);
      const modulePath = findModuleFromOptions(host, options, projectPath);
      if (options.inlineLoader) {
        addInlineLoader(host, modulePath, options.name, options.langs);
      }
      if (modulePath) {
        addScopeToModule(host, modulePath, options);
        return mergeWith(
          createTranslationFiles(options, rootPath, modulePath, host),
        )(host, context);
      }
    }

    return chain([
      externalSchematic(
        '@schematics/angular',
        'module',
        extractModuleOptions(options),
      ),
      (tree) => {
        const modulePath = tree.actions.find(
          (action) =>
            !!action.path.match(/\.module\.ts/) &&
            !action.path.match(/-routing\.module\.ts/),
        ).path;
        addScopeToModule(tree, modulePath, options);
        if (options.inlineLoader) {
          addInlineLoader(tree, modulePath, options.name, options.langs);
        }
        const translationRule = createTranslationFiles(
          options,
          rootPath,
          modulePath,
          host,
        );

        return mergeWith(translationRule);
      },
    ]);
  };
}
