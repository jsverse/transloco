import { dirname } from 'node:path';

import {
  chain,
  mergeWith,
  Rule,
  SchematicContext,
  SchematicsException,
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

import {
  checkIfTranslationFilesExist,
  createGlobalConfig,
  createTranslateFiles,
  getProject,
  setEnvironments,
  stringifyList,
} from '../../schematics-core';

import { Loaders, SchemaOptions } from './schema';
import { createLoaderFile } from './generators/http-loader.gen';
import { createTranslocoModule } from './generators/root-module.gen';

function updateEnvironmentBaseUrl(
  host: Tree,
  sourceRoot: string,
  defaultValue: string,
) {
  const template = `$1{
  baseUrl: '${defaultValue}',`;

  setEnvironments(host, sourceRoot, (env: string) =>
    env.indexOf('baseUrl') === -1
      ? env.replace(/(environment.*=*)\{/, template)
      : env,
  );
}

interface ResolveLoaderPathParams {
  host: Tree;
  mainPath: string;
  isStandalone: boolean;
  modulePath: string;
}

function resolveLoaderPath({
  host,
  mainPath,
  isStandalone,
  modulePath,
}: ResolveLoaderPathParams) {
  let resolved = modulePath;
  if (isStandalone) {
    const bootstrapCall = findBootstrapApplicationCall(host, mainPath);
    resolved =
      findAppConfig(bootstrapCall, host, mainPath)?.filePath || mainPath;
    resolved = dirname(resolved);
  }

  return resolved;
}

/**
 * Checks whether a directory "exists" in the schematic Tree.
 *
 * In the Angular DevKit schematic virtual file system, directories are *not real entities* —
 * only files exist. A directory is considered to "exist" if it has at least one file or
 * subdirectory (that itself contains files) under its path.
 *
 * This function returns `true` if the given directory path contains any files or subdirectories,
 * and `false` otherwise (including for empty or nonexistent directories).
 *
 * @param tree - The schematic virtual file system (Tree)
 * @param dirPath - The path to check, e.g. '/src' or '/public'
 */
function dirExists(tree: Tree, dirPath: string): boolean {
  const dir = tree.getDir(dirPath);
  return dir.subfiles.length > 0 || dir.subdirs.length > 0;
}

/**
 * Detects the appropriate path for translation assets based on Angular project structure.
 *
 * Angular 18+ introduced a new project structure using a `public/` directory next to the
 * project's `src/` instead of `src/assets/` for static assets. In a multi-project workspace
 * every application serves its own `public/` folder, so the detection is relative to the
 * selected project and never to the workspace root. It follows a three-tier strategy:
 *
 * 1. **Directory existence check**: If `<projectRoot>/public` exists, assume Angular 18+ structure
 * 2. **Legacy assets check**: If `${sourceRoot}/assets` exists, use traditional structure
 * 3. **Version fallback**: Parse package.json @angular/core version as final determination
 *
 * The detection accounts for the fact that in schematics, we're working with a virtual file
 * system where directories only "exist" if they contain files, and we need to make the right
 * choice for where users expect their translation files to be placed.
 *
 * @param host - The schematic virtual file system (Tree)
 * @param projectRoot - The project root path ('' for a root project, 'projects/app-name' otherwise)
 * @param sourceRoot - The source root path (typically 'src' or 'projects/app-name/src')
 * @returns The detected assets path, e.g. 'public/i18n/' or 'src/assets/i18n/'
 */
function detectAssetsPath(
  host: Tree,
  projectRoot: string,
  sourceRoot: string,
): string {
  const publicPath = joinPaths(projectRoot, 'public');
  if (dirExists(host, `/${publicPath}`)) {
    return `${publicPath}/i18n/`;
  }

  if (dirExists(host, `${sourceRoot}/assets`)) {
    return `${sourceRoot}/assets/i18n/`;
  }

  // Fallback: Check package.json for Angular version
  try {
    const packageJson = JSON.parse(host.read('/package.json')!.toString());
    const version =
      packageJson.dependencies?.['@angular/core'] ||
      packageJson.devDependencies?.['@angular/core'];
    // The first integer of the range: "^18.2.0", "~17.0.0", ">=16.0.0", "^20", ">=18 <21", etc.
    const majorVersion = parseInt(version.match(/\d+/)[0]);
    return majorVersion >= 18
      ? `${publicPath}/i18n/`
      : `${sourceRoot}/assets/i18n/`;
  } catch {
    return `${sourceRoot}/assets/i18n/`; // Safe default
  }
}

function joinPaths(...parts: string[]) {
  return parts.filter(Boolean).join('/');
}

function getUrlPathFromAssetsPath(assetsPath: string, projectRoot: string) {
  const publicPrefix = `${joinPaths(projectRoot, 'public')}/`;
  if (assetsPath.startsWith(publicPrefix)) {
    return assetsPath.slice(publicPrefix.length);
  }
  return assetsPath;
}

export function ngAdd(options: SchemaOptions): Rule {
  return async (host: Tree, context: SchematicContext) => {
    const langs = options.langs.split(',').map((l) => l.trim());
    if (!options.project) {
      throw new SchematicsException(
        'Project name is required. You must explicitly provide the project name using --project=<project-name>',
      );
    }
    const project = getProject(host, options.project);
    const sourceRoot = project.sourceRoot ?? 'src';
    const projectRoot = project.root ?? '';
    const isLib = project.projectType === 'library';
    const assetsPath = options.path
      ? `${sourceRoot}/${options.path}`
      : detectAssetsPath(host, projectRoot, sourceRoot);
    const urlPath = getUrlPathFromAssetsPath(assetsPath, projectRoot);
    const mainPath = await getMainFilePath(host, options.project);
    const isStandalone = isStandaloneApp(host, mainPath);
    const modulePath = isStandalone
      ? ''
      : dirname(getAppModulePath(host, mainPath));

    const actions: Rule[] = [];

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
              code`${external('provideHttpClient', '@angular/common/http')}()`,
          ),
        );
      } else {
        actions.push(
          addRootImport(
            options.project,
            ({ code, external }) =>
              code`${external('HttpClientModule', '@angular/common/http')}`,
          ),
        );
      }

      actions.push(
        mergeWith(
          createLoaderFile({
            ssr: options.ssr,
            loaderPath,
            urlPath,
          }),
        ),
      );
    }

    const hasTranslationFiles = checkIfTranslationFilesExist(
      assetsPath,
      langs,
      '.json',
      true,
    );
    if (!hasTranslationFiles) {
      actions.push(mergeWith(createTranslateFiles(langs, assetsPath)));
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
        }),
      );
    } else {
      actions.push(
        addRootImport(
          options.project,
          ({ code, external }) =>
            code`${external('TranslocoRootModule', './transloco-root.module')}`,
        ),
        mergeWith(
          createTranslocoModule({
            sourceRoot,
            isLib,
            ssr: options.ssr,
            langs,
            modulePath,
            host,
          }),
        ),
      );
    }

    if (options.ssr) {
      updateEnvironmentBaseUrl(host, sourceRoot, 'http://localhost:4200');
    }

    createGlobalConfig(host, langs, assetsPath);

    return chain(actions)(host, context) as Rule;
  };
}
