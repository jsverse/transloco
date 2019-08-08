import {
  SchematicContext,
  Tree,
  Rule,
  EmptyTree,
  HostTree,
  apply,
  source,
  move,
  chain,
  mergeWith,
  SchematicsException,
  template,
  url,
  Source,
  noop
} from '@angular-devkit/schematics';
import { createSourceFile, SourceFile, ScriptTarget } from 'typescript';
import { LIB_NAME } from '../schematics.consts';
import { addImportToModule, insertImport, addProviderToModule } from '../utils/ast-utils';
import { InsertChange } from '../utils/change';
import { findRootModule } from '../utils/find-module';
import { getProject } from '../utils/projects';
import { SchemaOptions, Loaders, TranslationFileTypes } from './schema';

function jsonTranslationFileCreator(source, lang) {
  return source.create(
    `${lang}.json`,
    `{
  "title": "transloco ${lang}",
  "dynamic": "transloco {{value}}"
}
`
  );
}

function typescriptTranslationFileCreator(source, lang) {
  return source.create(
    `${lang}.ts`,
    `export default {
  title: "transloco ${lang}",
  dynamic: "transloco {{value}}"
};
`
  );
}

function createTranslateFiles(langs: string[], creator): HostTree {
  const treeSource = new EmptyTree();
  langs.forEach(lang => {
    creator(treeSource, lang);
  });

  return treeSource;
}

export function getModuleFile(host: Tree, options: SchemaOptions): SourceFile {
  const modulePath = options.module;

  if (!host.exists(modulePath)) {
    throw new SchematicsException(`File ${modulePath} does not exist.`);
  }

  const text = host.read(modulePath);
  if (text === null) {
    throw new SchematicsException(`File ${modulePath} does not exist.`);
  }
  const sourceText = text.toString('utf-8');

  return createSourceFile(modulePath, sourceText, ScriptTarget.Latest, true);
}

export function applyChanges(host: Tree, path: string, changes: InsertChange[]): Tree {
  const recorder = host.beginUpdate(path);

  for (const change of changes) {
    if (change instanceof InsertChange) {
      recorder.insertLeft(change.pos, change.toAdd);
    }
  }
  host.commitUpdate(recorder);

  return host;
}

export function addImportsToModuleFile(options: SchemaOptions, imports: string[], file = LIB_NAME): Rule {
  return host => {
    const module = getModuleFile(host, options);
    const importChanges = insertImport(module, options.module, imports.join(', '), file);

    return applyChanges(host, options.module, [importChanges] as InsertChange[]);
  };
}

export function addImportsToModuleDeclaration(options: SchemaOptions, imports: string[]): Rule {
  return host => {
    const module = getModuleFile(host, options);

    const importChanges = imports.map(imp => addImportToModule(module, options.module, imp, LIB_NAME)[0]);
    return applyChanges(host, options.module, importChanges as InsertChange[]);
  };
}

export function addProvidersToModuleDeclaration(options: SchemaOptions, providers: string[]): Rule {
  return host => {
    const module = getModuleFile(host, options);

    const providerChanges = addProviderToModule(module, options.module, providers.join(',\n    ') + '\n  ', LIB_NAME);

    return applyChanges(host, options.module, providerChanges as InsertChange[]);
  };
}

function getLoaderTemplates(loader, path): Source {
  const loaderFolder = loader === Loaders.Webpack ? 'webpack-loader' : 'http-loader';
  return apply(url(`./files/${loaderFolder}`), [
    template({
      ts: 'ts'
    }),
    move('/', path)
  ]);
}

export default function(options: SchemaOptions): Rule {
  return (host: Tree, context: SchematicContext) => {
    const langs = options.langs.split(',').map(l => l.trim());
    const project = getProject(host);

    const root = (project && project.root) || '';
    const sourceRoot = (project && project.sourceRoot) || 'src';

    const rootModule = options.module;

    // TODO: try not to taking it as HC.
    const assetsPath = root + `src/assets/i18n/`;

    const translationCreator =
      options.translateType === TranslationFileTypes.Typescript
        ? typescriptTranslationFileCreator
        : jsonTranslationFileCreator;

    const translateFiles = apply(source(createTranslateFiles(langs, translationCreator)), [move('/', assetsPath)]);

    options.module = findRootModule(host, options.module, sourceRoot) as string;
    const configProviderTemplate = `{
      provide: TRANSLOCO_CONFIG,
      useValue: {
        runtime: false,
        defaultLang: 'en',
        prodMode: environment.production
      } as TranslocoConfig
    }`;

    return chain([
      mergeWith(translateFiles),
      options.loader === Loaders.Http
        ? chain([
            addImportsToModuleFile(options, ['HttpClientModule'], '@angular/common/http'),
            addImportsToModuleDeclaration(options, ['HttpClientModule'])
          ])
        : noop(),
      mergeWith(getLoaderTemplates(options.loader, sourceRoot + '/' + rootModule)),
      addImportsToModuleFile(options, ['environment'], '../environments/environment'),
      addImportsToModuleFile(options, ['translocoLoader'], './transloco.loader'),
      addImportsToModuleFile(options, ['TranslocoModule', 'TRANSLOCO_CONFIG', 'TranslocoConfig']),
      addImportsToModuleDeclaration(options, ['TranslocoModule']),
      addProvidersToModuleDeclaration(options, [configProviderTemplate, 'translocoLoader'])
    ])(host, context);
  };
}
