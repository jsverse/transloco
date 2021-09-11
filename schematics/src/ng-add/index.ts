import {
  apply,
  chain,
  EmptyTree,
  HostTree,
  mergeWith,
  move,
  noop,
  Rule,
  SchematicContext,
  SchematicsException,
  source,
  Source,
  template,
  Tree,
  url,
} from '@angular-devkit/schematics';
import {createSourceFile, ScriptTarget, SourceFile} from 'typescript';
import {LIB_NAME} from '../schematics.consts';
import {stringifyList} from '../utils/array';
import {addImportToModule, insertImport} from '../utils/ast-utils';
import {InsertChange} from '../utils/change';
import {findRootModule} from '../utils/find-module';
import {getProject, setEnvironments} from '../utils/projects';
import {checkIfTranslationFilesExist} from '../utils/translations';
import {createConfig} from '../utils/transloco';
import {SchemaOptions, Loaders} from './schema';
const path = require('path');

function jsonTranslationFileCreator(source, lang) {
  return source.create(
    `${lang}.json`,
    `{}
`
  );
}

function createTranslateFiles(langs: string[], creator): HostTree {
  const treeSource = new EmptyTree();
  langs.forEach((lang) => {
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

export function applyChanges(
  host: Tree,
  path: string,
  changes: InsertChange[]
): Tree {
  const recorder = host.beginUpdate(path);

  for (const change of changes) {
    if (change instanceof InsertChange) {
      recorder.insertLeft(change.pos, change.toAdd);
    }
  }
  host.commitUpdate(recorder);

  return host;
}

export function addImportsToModuleFile(
  options: SchemaOptions,
  imports: string[],
  file = LIB_NAME
): Rule {
  return (host) => {
    const module = getModuleFile(host, options);
    const importChanges = insertImport(
      module,
      options.module,
      imports.join(', '),
      file
    );

    return applyChanges(host, options.module, [
      importChanges,
    ] as InsertChange[]);
  };
}

export function addImportsToModuleDeclaration(
  options: SchemaOptions,
  imports: string[]
): Rule {
  return (host) => {
    const module = getModuleFile(host, options);

    const importChanges = imports.map(
      (imp) => addImportToModule(module, options.module, imp, LIB_NAME)[0]
    );
    return applyChanges(host, options.module, importChanges as InsertChange[]);
  };
}

function createTranslocoModule({isLib, ssr, langs, modulePath, sourceRoot}: {
  isLib: boolean,
  ssr: boolean,
  langs: string[],
  modulePath: string,
  sourceRoot: string,
}): Source {
  return apply(url(`./files/transloco-module`), [
    template({
      ts: 'ts',
      stringifyList: stringifyList,
      isLib: isLib,
      langs: langs,
      importEnv: ssr || !isLib,
      envPath: path.relative(modulePath, `${sourceRoot}/environments/environment`),
      loaderPrefix: ssr ? '${environment.baseUrl}' : '',
      prodMode: isLib ? 'false' : 'environment.production',
    }),
    move('/', modulePath),
  ]);
}

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

export default function (options: SchemaOptions): Rule {
  return (host: Tree, context: SchematicContext) => {
    const langs = options.langs.split(',').map((l) => l.trim());
    const project = getProject(host, options.project);
    const sourceRoot = (project && project.sourceRoot) || 'src';
    const isLib = project.projectType === 'library';
    const assetsPath = `${sourceRoot}/${options.path}`;

    const translationCreator = jsonTranslationFileCreator;

    const translateFiles = apply(
      source(createTranslateFiles(langs, translationCreator)),
      [move('/', assetsPath)]
    );

    options.module = findRootModule(host, options.module, sourceRoot) as string;
    const modulePath =
      options.module.substring(0, options.module.lastIndexOf('/') + 1);

    if (options.ssr) {
      updateEnvironmentBaseUrl(host, sourceRoot, 'http://localhost:4200');
    }

    createConfig(host, langs, assetsPath);

    return chain([
      options.loader === Loaders.Http
        ? chain([
          addImportsToModuleFile(
            options,
            ['HttpClientModule'],
            '@angular/common/http'
          ),
          addImportsToModuleDeclaration(options, ['HttpClientModule']),
        ])
        : noop(),
      checkIfTranslationFilesExist(assetsPath, langs, '.json', true)
        ? noop()
        : mergeWith(translateFiles),
      mergeWith(createTranslocoModule({sourceRoot, isLib, ssr: options.ssr, langs, modulePath})),
      addImportsToModuleFile(
        options,
        ['TranslocoRootModule'],
        './transloco-root.module'
      ),
      addImportsToModuleDeclaration(options, ['TranslocoRootModule']),
    ])(host, context);
  };
}
