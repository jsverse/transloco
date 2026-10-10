import { existsSync, statSync } from 'node:fs';
import * as path from 'node:path';

import { cosmiconfigSync, type CosmiconfigResult } from 'cosmiconfig';

import {
  assertConfigPlacesAreFiles,
  assertExplorerCanBeMade,
  assertRegularFile,
  nameConfigFile,
} from './load-error.js';
import { TranslocoGlobalConfig } from './transloco-utils.types.js';

export function getGlobalConfig(searchPath = ''): TranslocoGlobalConfig {
  const resolvedPath = path.resolve(process.cwd(), searchPath);

  // Whatever is no regular file is refused before anything is opened
  assertExplorerCanBeMade();
  assertRegularFile(resolvedPath);
  assertConfigPlacesAreFiles(resolvedPath);

  const explorer = cosmiconfigSync('transloco');
  // cosmiconfig 9+ treats a search path as a directory, so a config file path must be loaded directly.
  const configSearch = isFile(resolvedPath)
    ? explorer.load(resolvedPath)
    : explorer.search(resolvedPath);

  return configSearch ? unwrapConfig(configSearch) : {};
}

/**
 * The config of a project whose sources are in the directory, together with
 * the file it was read from. Unlike `getGlobalConfig`, which looks in the
 * directory alone, the search goes up through the parent directories, up to
 * and including the working directory, and uses the first config it finds.
 * A directory outside of the working directory is followed by the working
 * directory itself. When the working directory holds no `package.json` the
 * search carries on above it, up to the first directory that does, which is
 * the root of the package the working directory belongs to. Without such a
 * directory nothing above the working directory is looked at. A config that
 * fails to load is reported with the file it is in.
 */
export function searchGlobalConfig(dir = ''): {
  config: TranslocoGlobalConfig;
  filepath?: string;
} {
  assertExplorerCanBeMade();

  const explorer = cosmiconfigSync('transloco');

  for (const searchDir of searchDirs(dir)) {
    let configSearch: CosmiconfigResult;

    assertConfigPlacesAreFiles(searchDir);

    try {
      configSearch = explorer.search(searchDir);
    } catch (error) {
      throw nameConfigFile(error, searchDir);
    }

    if (configSearch) {
      return {
        config: unwrapConfig(configSearch),
        filepath: configSearch.filepath,
      };
    }
  }

  return { config: {} };
}

const MODULE_CONFIG = /\.[cm]?[jt]s$/;

function unwrapConfig({
  config,
  filepath,
  isEmpty,
}: NonNullable<CosmiconfigResult>): TranslocoGlobalConfig {
  // `load()` reports an empty file as `isEmpty` instead of skipping it like `search()` does.
  if (isEmpty) {
    return {};
  }

  // cosmiconfig 10+ no longer unwraps the default export of a TS config.
  return MODULE_CONFIG.test(filepath) &&
    config &&
    typeof config === 'object' &&
    'default' in config
    ? config.default
    : config;
}

function searchDirs(dir: string): string[] {
  const cwd = process.cwd();

  return [...dirsUpToCwd(path.resolve(cwd, dir), cwd), ...dirsAboveCwd(cwd)];
}

/**
 * The directory, then its parents up to the working directory. A directory
 * that is not below the working directory is followed by the working directory
 * alone, which is what walking up to the filesystem root without meeting it
 * means.
 */
function dirsUpToCwd(start: string, cwd: string): string[] {
  const dirs: string[] = [];

  for (let current = start; ;) {
    dirs.push(current);

    if (isSamePath(current, cwd)) {
      return dirs;
    }

    const parent = path.dirname(current);

    if (parent === current) {
      return [start, cwd];
    }

    current = parent;
  }
}

/**
 * The parents of the working directory up to the first one holding a
 * `package.json`, none when the working directory holds one itself or when
 * no parent does.
 */
function dirsAboveCwd(cwd: string): string[] {
  const dirs: string[] = [];

  for (let current = cwd; !hasPackageJson(current);) {
    const parent = path.dirname(current);

    if (parent === current) {
      return [];
    }

    dirs.push(parent);
    current = parent;
  }

  return dirs;
}

function hasPackageJson(dir: string): boolean {
  return existsSync(path.join(dir, 'package.json'));
}

// Windows paths are not case sensitive.
function isSamePath(a: string, b: string): boolean {
  return process.platform === 'win32'
    ? a.toLowerCase() === b.toLowerCase()
    : a === b;
}

// Any stat error (ENOENT, ENOTDIR, EACCES, ...) falls through to `search()`, which reports it as before.
function isFile(filePath: string): boolean {
  try {
    return statSync(filePath).isFile();
  } catch {
    return false;
  }
}
