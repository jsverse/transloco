/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Path, join, normalize, relative, strings, basename, extname, dirname } from '@angular-devkit/core';
import { DirEntry, Tree } from '@angular-devkit/schematics';

/**
 * Find the module referred by a set of options passed to the schematics.
 */
export function findRootModule(host: Tree, module: string, rootPath = '', skipImport = false): string | undefined {
  if (skipImport || !module) {
    return undefined;
  }

  const modulePath = normalize(`${rootPath}/${module}/${module}`);
  if (host.exists(modulePath)) {
    return modulePath;
  } else if (host.exists(modulePath + '.ts')) {
    return normalize(modulePath + '.ts');
  } else if (host.exists(modulePath + '.module.ts')) {
    return normalize(modulePath + '.module.ts');
  } else {
    throw new Error(`Specified module path ${modulePath} does not exist`);
  }
}

/**
 * Function to find the "closest" module to a generated file's path.
 */
export function findModuleDrillDown(host: Tree, generateDir: string): string {
  let dir: DirEntry | null = host.getDir('/' + generateDir);
  const moduleRe = /\.module\.ts$/;
  const routingModuleRe = /-routing\.module\.ts/;

  console.log(dir);

  while (dir) {
    const matches = dir.subfiles.filter(p => moduleRe.test(p) && !routingModuleRe.test(p));

    if (matches.length == 1) {
      return join(dir.path, matches[0]);
    } else if (matches.length > 1) {
      throw new Error(
        'More than one module matches. Use skip-import option to skip importing ' +
          'the component into the closest module.'
      );
    }

    dir = dir.parent;
  }

  throw new Error('Could not find an NgModule. Use the skip-import ' + 'option to skip importing in NgModule.');
}
