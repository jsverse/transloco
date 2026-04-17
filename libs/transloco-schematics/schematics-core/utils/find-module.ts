/* eslint-disable */
// @ts-nocheck
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {
  Path,
  join,
  normalize,
  dirname,
  NormalizedRoot,
} from '@angular-devkit/core';
import { DirEntry, Tree } from '@angular-devkit/schematics';

export const MODULE_EXT = '.module.ts';
export const ROUTING_MODULE_EXT = '-routing.module.ts';

/**
 * Find the module referred by a set of options passed to the schematics.
 */
export function findModuleFromOptions(
  host: Tree,
  options,
  projectPath,
): Path | undefined {
  if (
    Object.prototype.hasOwnProperty.call(options, 'skipImport') &&
    options.skipImport
  ) {
    return undefined;
  }

  const moduleExt = options.moduleExt || MODULE_EXT;
  const routingModuleExt = options.routingModuleExt || ROUTING_MODULE_EXT;

  if (!options.module) {
    const pathToCheck = (projectPath || '') + '/' + options.name;
    const module = findModule(host, pathToCheck, moduleExt, routingModuleExt);
    return module ? normalize(module) : null;
  } else {
    const modulePath = normalize(`/${projectPath}/${options.module}`);
    const componentPath = normalize(`/${projectPath}/${options.name}`);
    const moduleBaseName = normalize(modulePath).split('/').pop();

    const candidateSet = new Set<Path>([normalize(projectPath || '/')]);

    for (let dir = modulePath; dir != NormalizedRoot; dir = dirname(dir)) {
      candidateSet.add(dir);
    }
    for (let dir = componentPath; dir != NormalizedRoot; dir = dirname(dir)) {
      candidateSet.add(dir);
    }

    const candidatesDirs = [...candidateSet].sort(
      (a, b) => b.length - a.length,
    );
    for (const c of candidatesDirs) {
      const candidateFiles = [
        '',
        `${moduleBaseName}.ts`,
        `${moduleBaseName}${moduleExt}`,
      ].map((x) => join(c, x));

      for (const sc of candidateFiles) {
        if (host.exists(sc)) {
          return normalize(sc);
        }
      }
    }
    return null;
  }
}

/**
 * Function to find the "closest" module to a generated file's path.
 */
export function findModule(
  host: Tree,
  generateDir: string,
  moduleExt = MODULE_EXT,
  routingModuleExt = ROUTING_MODULE_EXT,
): Path {
  let dir: DirEntry | null = host.getDir('/' + generateDir);
  let foundRoutingModule = false;

  while (dir) {
    const allMatches = dir.subfiles.filter((p) => p.endsWith(moduleExt));
    const filteredMatches = allMatches.filter(
      (p) => !p.endsWith(routingModuleExt),
    );

    foundRoutingModule =
      foundRoutingModule || allMatches.length !== filteredMatches.length;

    if (filteredMatches.length == 1) {
      return join(dir.path, filteredMatches[0]);
    } else if (filteredMatches.length > 1) {
      return null;
    }

    dir = dir.parent;
  }

  return null;
}
