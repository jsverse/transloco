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
import { PathFragment } from '@angular-devkit/core';
import { ScriptTarget, createSourceFile } from 'typescript';
import {
  addProviderToModule,
  insertImport,
  addImportToModule,
} from '@schematics/angular/utility/ast-utils';
import { applyChangesToFile } from '@schematics/angular/utility/standalone/util';
import { Change, NoopChange } from '@schematics/angular/utility/change';

import {
  NAMES,
  coerceArray,
  stringifyList,
  findModuleFromOptions,
  getProject,
  createTranslateFilesFromOptions,
  getGlobalConfig,
} from '../../schematics-core';

import { SchemaOptions } from './schema';
import { getProjectPath } from './utils';

function getProviderValue(options: SchemaOptions) {
  const name = dasherize(options.name);
  if (!options.inlineLoader) return `'${name}'`;
  return `{ scope: '${name}', loader }`;
}

const SCOPE_IMPORTS = [
  'provideTranslocoScope',
  'TranslocoDirective',
  'TranslocoPipe',
];

function parseModule(tree: Tree, modulePath: string) {
  const module = tree.read(modulePath);
  if (!module) {
    throw new Error(`Could not read module file at ${modulePath}`);
  }

  // `createSourceFile` here uses the workspace's own `typescript` package,
  // while `@schematics/angular`'s ast-utils vendors its own internal copy of
  // the TypeScript compiler API types (third_party/.../TypeScript). The AST
  // shapes are compatible at runtime, but structurally distinct to the type
  // checker, so an explicit cast is required at this interop boundary.
  return createSourceFile(
    modulePath,
    module.toString('utf-8'),
    ScriptTarget.Latest,
    true,
  ) as unknown as Parameters<typeof addProviderToModule>[0];
}

/**
 * The AST helpers answer "already there" with a `NoopChange` or an empty
 * result, neither of which `applyChangesToFile` accepts.
 */
function applyChanges(
  tree: Tree,
  modulePath: string,
  changes: (Change | undefined)[],
) {
  applyChangesToFile(
    tree,
    modulePath,
    changes.filter(
      (change): change is Change => !!change && !(change instanceof NoopChange),
    ),
  );
}

function addScopeToModule(
  tree: Tree,
  modulePath: string,
  options: SchemaOptions,
) {
  const moduleSource = parseModule(tree, modulePath);
  const provider = `provideTranslocoScope(${getProviderValue(options)})`;
  const changes: (Change | undefined)[] = [];
  changes.push(
    addProviderToModule(moduleSource, modulePath, provider, NAMES.LIB_NAME)[0],
  );
  for (const standalone of ['TranslocoDirective', 'TranslocoPipe']) {
    changes.push(
      addImportToModule(
        moduleSource,
        modulePath,
        standalone,
        NAMES.LIB_NAME,
      )[0],
    );
  }
  if (options.inlineLoader) {
    changes.push(
      insertImport(moduleSource, modulePath, 'loader', './transloco.loader'),
    );
  }

  applyChanges(tree, modulePath, changes);

  // `insertImport` recognizes an existing import by a single symbol name, so
  // each symbol goes in on its own. The module is re-read in between so the
  // next one sees the import the previous one created and joins it, rather
  // than adding another statement.
  for (const symbol of SCOPE_IMPORTS) {
    applyChanges(tree, modulePath, [
      insertImport(
        parseModule(tree, modulePath),
        modulePath,
        symbol,
        NAMES.LIB_NAME,
      ),
    ]);
  }
}

function getTranslationFilesFromAssets(
  host: Tree,
  translationsPath: string,
): string[] {
  const langFiles = host.root.dir(
    translationsPath as unknown as PathFragment,
  ).subfiles;
  return Array.from(
    new Set(langFiles.map((file: string) => file.split('.')[0])),
  );
}

function getTranslationFiles(
  options: SchemaOptions,
  host: Tree,
  translationsPath: string,
): string[] {
  return coerceArray(
    options.langs ||
      getGlobalConfig().langs ||
      getTranslationFilesFromAssets(host, translationsPath),
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

function createTranslationFiles(
  options: SchemaOptions,
  rootPath: string,
  modulePath: string,
  host: Tree,
) {
  if (options.skipCreation) {
    return empty();
  }
  const defaultPath = options.inlineLoader
    ? join(dirname(modulePath), 'i18n')
    : join(rootPath, 'assets', 'i18n', dasherize(options.name));
  const translationsPath = options.translationPath
    ? join(rootPath, options.translationPath)
    : defaultPath;

  return createTranslateFilesFromOptions(host, {
    ...options,
    langs: coerceArray(options.langs),
    translationFilePath: translationsPath,
  });
}

function extractModuleOptions({
  name,
  path,
  project,
  routing,
  flat,
  commonModule,
}: SchemaOptions) {
  return { name, path, project, routing, flat, commonModule };
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
      if (modulePath) {
        if (options.inlineLoader) {
          addInlineLoader(host, modulePath, options.name, options.langs);
        }
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
        // Angular names the file `<name>.module.ts` up to v19 and
        // `<name>-module.ts` from v20 on. Match on the scope name so we never
        // pick another module the tree happens to hold (nor its routing one).
        const scopeFileName = dasherize(options.name.split('/').pop() ?? '');
        const moduleFile = new RegExp(`/${scopeFileName}[.-]module\\.ts$`);
        const moduleAction = tree.actions.find((action) =>
          moduleFile.test(action.path),
        );
        if (!moduleAction) {
          throw new Error('Could not find the generated module file.');
        }
        const modulePath = moduleAction.path;
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
