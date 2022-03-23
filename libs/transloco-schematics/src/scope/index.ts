import { dasherize } from '@angular-devkit/core/src/utils/strings';
import {
  Rule,
  Tree,
  SchematicContext,
  externalSchematic,
  mergeWith,
  source,
  EmptyTree,
} from '@angular-devkit/schematics';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ScriptTarget, createSourceFile } from 'typescript';
import { applyChanges } from '../ng-add';
import { LIB_NAME } from '../schematics.consts';
import { coerceArray, stringifyList } from '../utils/array';
import {
  addProviderToModule,
  insertImport,
  addImportToModule,
} from '../utils/ast-utils';
import { findModuleFromOptions } from '../utils/find-module';
import { getProject, getProjectPath } from '../utils/projects';
import { createTranslateFilesFromOptions } from '../utils/translations';
import { SchemaOptions } from './schema';
import * as p from 'path';
import { getConfig } from '../utils/config';
import { Change, InsertChange } from '../utils/change';

function getProviderValue(options: SchemaOptions) {
  const name = dasherize(options.name);
  if (!options.inlineLoader) return `'${name}'`;
  return `{ scope: '${name}', loader }`;
}

function addScopeToModule(
  tree: Tree,
  modulePath: string,
  options: SchemaOptions
) {
  const module = tree.read(modulePath);

  const moduleSource = createSourceFile(
    modulePath,
    module.toString('utf-8'),
    ScriptTarget.Latest,
    true
  );
  const provider = `{ provide: TRANSLOCO_SCOPE, useValue: ${getProviderValue(
    options
  )} }`;
  const changes: Change[] = [];
  changes.push(
    addProviderToModule(moduleSource, modulePath, provider, LIB_NAME)[0]
  );
  changes.push(
    addImportToModule(moduleSource, modulePath, 'TranslocoModule', LIB_NAME)[0]
  );
  changes.push(
    insertImport(
      moduleSource,
      modulePath,
      'TRANSLOCO_SCOPE, TranslocoModule',
      LIB_NAME
    )
  );
  if (options.inlineLoader) {
    changes.push(
      insertImport(moduleSource, modulePath, 'loader', './transloco.loader')
    );
  }

  applyChanges(tree, modulePath, changes as InsertChange[]);
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
  langs: string | string[]
) {
  const loader = `export const loader = [${stringifyList(
    coerceArray(langs)
  )}].reduce((acc: any, lang: string) => {
  acc[lang] = () => import(\`./i18n/\${lang}.json\`);
  return acc;
}, {});

`;
  const path = p.join(p.dirname(modulePath), 'transloco.loader.ts');
  tree.create(path, loader);
}

function createTranslationFiles(
  options,
  rootPath,
  modulePath,
  host: Tree
): Tree {
  if (options.skipCreation) {
    return new EmptyTree();
  }
  const defaultPath = options.inlineLoader
    ? p.join(p.dirname(modulePath), 'i18n')
    : p.join(rootPath, 'assets', 'i18n', dasherize(options.name));
  const translationsPath = options.translationPath
    ? p.join(rootPath, options.translationPath)
    : defaultPath;

  return createTranslateFilesFromOptions(host, options, translationsPath);
}

export default function (options: SchemaOptions): Rule {
  // @ts-ignore
  return (host: Tree, context: SchematicContext) => {
    const project = getProject(host, options.project);
    const rootPath = (project && project.sourceRoot) || 'src';
    const assetsPath = p.join(rootPath, 'assets', 'i18n');
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
          source(createTranslationFiles(options, rootPath, modulePath, host))
        )(host, context);
      }
    }

    const cmpRule = externalSchematic('@schematics/angular', 'module', options);
    const tree$ = (cmpRule(host, context) as unknown as Observable<Tree>).pipe(
      tap((tree) => {
        const modulePath = tree.actions.find(
          (action) =>
            !!action.path.match(/\.module\.ts/) &&
            !action.path.match(/-routing\.module\.ts/)
        ).path;
        addScopeToModule(tree, modulePath, options);
        if (options.inlineLoader) {
          addInlineLoader(tree, modulePath, options.name, options.langs);
        }
        const translationRule = createTranslationFiles(
          options,
          rootPath,
          modulePath,
          host
        );
        tree.merge(translationRule);
      })
    );

    return tree$;
  };
}
