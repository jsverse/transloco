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
  noop
} from '@angular-devkit/schematics';
import { createSourceFile, SourceFile, ScriptTarget } from 'typescript';
import { LIB_NAME } from '../schematics.consts';
import { addImportToModule, insertImport, addProviderToModule } from '../utils/ast-utils';
import { InsertChange } from '../utils/change';
import { findRootModule } from '../utils/find-module';
import { getProject } from '../utils/projects';
import { SchemaOptions, Loaders } from './schema';

function createTranslateFiles(langs: string[]): HostTree {
  const treeSource = new EmptyTree();
  langs.forEach(lang => {
    treeSource.create(
      lang + '.json',
      `
{
  "hello": "transloco ${lang}",
  "dynamic": "transloco {{value}}"
}
    `
    );
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

    const providerChanges = addProviderToModule(module, options.module, providers.join(',\n    '), LIB_NAME);

    return applyChanges(host, options.module, providerChanges as InsertChange[]);
  };
}

function addCodeToModuleFile(options: SchemaOptions, template: string): Rule {
  return host => {
    const tsFile = getModuleFile(host, options);
    const end = tsFile.getEnd();
    const change = new InsertChange(options.module, end, template);

    return applyChanges(host, options.module, [change]);
  };
}

function getLoaderTemplates(loader: Loaders): { loaderTemplate: string; loaderProvider: string } {
  const httpTemplate = `
export function HttpLoader(http: HttpClient) {
  return function(lang: string) {
    return http.get(\`../assets/i18n/\${lang}.json\`);
  };
}`;

  const webpackTemplate = `
export function WebpackLoader() {
  return function(lang: string) {
    return import(\`../assets/i18n/\${lang}.json\`).then(module => module.default);
  };
}`;

  const provider = (factory: string) => `{ provide: TRANSLOCO_LOADER, useFactory: ${factory} }`;

  switch (loader) {
    case Loaders.Http:
      return { loaderTemplate: httpTemplate, loaderProvider: provider('HttpLoader') };
    case Loaders.Webpack:
      return { loaderTemplate: webpackTemplate, loaderProvider: provider('WebpackLoader') };
  }
}

export default function(options: SchemaOptions): Rule {
  return (host: Tree, context: SchematicContext) => {
    const langs = options.langs.split(',').map(l => l.trim());
    const project = getProject(host);

    // TODO: try not to taking it as HC.
    const assetsPath = project.root + `src/assets/i18n/`;
    const translateFiles = apply(source(createTranslateFiles(langs)), [move('/', assetsPath)]);

    options.module = findRootModule(host, options.module, project.sourceRoot) as string;
    const configProviderTemplate = `{
      provide: TRANSLOCO_CONFIG,
      useValue: {
        runtime: false,
        defaultLang: 'en',
        prodMode: environment.production
      } as TranslocoConfig
    }`;
    let { loaderTemplate, loaderProvider } = getLoaderTemplates(options.loader);

    return chain([
      mergeWith(translateFiles),
      options.loader === Loaders.Http
        ? addImportsToModuleFile(options, ['HttpClient'], '@angular/common/http')
        : noop(),
      addImportsToModuleFile(options, ['environment'], '../environments/environment'),
      addImportsToModuleFile(options, ['TranslocoModule', 'TRANSLOCO_CONFIG', 'TRANSLOCO_LOADER', 'TranslocoConfig']),
      addImportsToModuleDeclaration(options, ['TranslocoModule']),
      addProvidersToModuleDeclaration(options, [configProviderTemplate, loaderProvider]),
      addCodeToModuleFile(options, loaderTemplate)
    ])(host, context);
  };
}
