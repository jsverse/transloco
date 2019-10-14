import { dasherize } from '@angular-devkit/core/src/utils/strings';
import {
  Rule,
  Tree,
  SchematicContext,
  externalSchematic,
  Source,
  mergeWith,
  chain,
  noop
} from '@angular-devkit/schematics';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ScriptTarget, createSourceFile } from 'typescript';
import { applyChanges } from '../ng-add';
import { LIB_NAME } from '../schematics.consts';
import { addProviderToModule, insertImport, addImportToModule } from '../utils/ast-utils';
import { findModuleFromOptions } from '../utils/find-module';
import { getProject, getProjectPath } from '../utils/projects';
import { createTranslateFilesFromOptions } from '../utils/translations';
import { SchemaOptions } from './schema';

const p = require('path');

function addScopeToModule(tree: Tree, modulePath: string, name: string) {
  const module = tree.read(modulePath);

  const moduleSource = createSourceFile(modulePath, module.toString('utf-8'), ScriptTarget.Latest, true);
  const provider = `{ provide: TRANSLOCO_SCOPE, useValue: '${dasherize(name)}' }`;
  const changes = [];
  changes.push(addProviderToModule(moduleSource, modulePath, provider, LIB_NAME)[0]);
  changes.push(addImportToModule(moduleSource, modulePath, 'TranslocoModule', LIB_NAME)[0]);
  changes.push(insertImport(moduleSource, modulePath, 'TRANSLOCO_SCOPE, TranslocoModule', LIB_NAME));

  applyChanges(tree, modulePath, changes as any);
}

function getTranslationFilesFromAssets(host, translationsPath) {
  const langFiles = host.root.dir(translationsPath as any).subfiles;
  return langFiles.map(file => file.split('.')[0]);
}

function addTranslationFiles(options, rootPath, host: Tree): Source {
  const translationsPath = options.translationFilesPath
    ? p.join(rootPath, options.translationPath)
    : p.join(rootPath, 'assets', 'i18n');

  options.langs = options.langs
    ? options.langs.split(',').map(l => l.trim())
    : getTranslationFilesFromAssets(host, translationsPath);

  return createTranslateFilesFromOptions(host, options, p.join(translationsPath, dasherize(options.name)));
}

export default function(options: SchemaOptions): Rule {
  return (host: Tree, context: SchematicContext) => {
    const project = getProject(host, options.project);
    const path = (project && project.sourceRoot) || 'src';
    const translationFiles: any = options.skipCreation ? noop() : mergeWith(addTranslationFiles(options, path, host));

    if (options.module) {
      const projectPath = getProjectPath(host, project, options);
      const modulePath = findModuleFromOptions(host, options, projectPath);
      if (modulePath) {
        addScopeToModule(host, modulePath, options.name);
        return translationFiles(host, context);
      }
    }

    const cmpRule = externalSchematic('@schematics/angular', 'module', options);
    const tree$ = (chain([cmpRule, translationFiles])(host, context) as Observable<Tree>).pipe(
      tap(tree => {
        const modulePath = tree.actions.find(action => !!action.path.match(/\.module\.ts/)).path;
        addScopeToModule(tree, modulePath, options.name);
      })
    );

    return tree$;
  };
}
