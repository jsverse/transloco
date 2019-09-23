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
  SchematicsException,
  template,
  url,
  Source,
  mergeWith,
  noop
} from '@angular-devkit/schematics';
import { createSourceFile, SourceFile, ScriptTarget } from 'typescript';
import { LIB_NAME } from '../schematics.consts';
import { addImportToModule, insertImport, addProviderToModule } from '../utils/ast-utils';
import { InsertChange } from '../utils/change';
import { findRootModule } from '../utils/find-module';
import { getProject, setEnvironments } from '../utils/projects';
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

function getLoaderTemplates(options, path): Source {
  const loaderFolder = options.loader === Loaders.Webpack ? 'webpack-loader' : 'http-loader';

  return apply(url(`./files/${loaderFolder}`), [
    template({
      ts: 'ts',
      ssr: options.ssr,
      prefix: options.ssr ? '${environment.baseUrl}' : '',
      suffix: options.format === TranslationFileTypes.JSON ? '.json' : ''
    }),
    move('/', path)
  ]);
}

function updateEnvironmentBaseUrl(host: Tree, sourceRoot: string, defaultValue: any) {
  const template = `\$1{
  baseUrl: '${defaultValue}',`;

  setEnvironments(host, sourceRoot, (env: string) =>
    env.indexOf('baseUrl') === -1 ? env.replace(/(environment.*=*)\{/, template) : env
  );
}

export default function(options: SchemaOptions): Rule {
  return (host: Tree, context: SchematicContext) => {
    const langs = options.langs.split(',').map(l => l.trim());
    const project = getProject(host, options.project);
    const sourceRoot = (project && project.sourceRoot) || 'src';
    const isLib = project.projectType === 'library';
    const assetsPath = `${sourceRoot}/${options.path}`;

    const translationCreator =
      options.translateType === TranslationFileTypes.Typescript
        ? typescriptTranslationFileCreator
        : jsonTranslationFileCreator;

    const translateFiles = apply(source(createTranslateFiles(langs, translationCreator)), [move('/', assetsPath)]);

    options.module = findRootModule(host, options.module, sourceRoot) as string;
    const modulePath = options.module.substring(0, options.module.lastIndexOf('/') + 1);
    const prodMode = isLib ? 'false' : 'environment.production';
    const configProviderTemplate = `{
      provide: TRANSLOCO_CONFIG,
      useValue: {
        renderLangOnce: false,
        defaultLang: '${langs[0]}',
        fallbackLang: '${langs[0]}',
        prodMode: ${prodMode},
      } as TranslocoConfig
    }`;

    if (options.ssr) {
      updateEnvironmentBaseUrl(host, sourceRoot, 'http://localhost:4200');
    }

    return chain([
      mergeWith(translateFiles),
      options.loader === Loaders.Http
        ? chain([
            addImportsToModuleFile(options, ['HttpClientModule'], '@angular/common/http'),
            addImportsToModuleDeclaration(options, ['HttpClientModule'])
          ])
        : noop(),
      mergeWith(getLoaderTemplates(options, modulePath)),
      isLib ? noop() : addImportsToModuleFile(options, ['environment'], '../environments/environment'),
      addImportsToModuleFile(options, ['translocoLoader'], './transloco.loader'),
      addImportsToModuleFile(options, ['TranslocoModule', 'TRANSLOCO_CONFIG', 'TranslocoConfig']),
      addImportsToModuleDeclaration(options, ['TranslocoModule']),
      addProvidersToModuleDeclaration(options, [configProviderTemplate, 'translocoLoader'])
    ])(host, context);
  };
}
