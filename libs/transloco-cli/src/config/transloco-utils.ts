import { statSync } from 'node:fs';
import * as path from 'node:path';

import { cosmiconfigSync, type CosmiconfigResult } from 'cosmiconfig';

import { TranslocoGlobalConfig } from './transloco-utils.types.js';

export function getGlobalConfig(searchPath = ''): TranslocoGlobalConfig {
  const explorer = cosmiconfigSync('transloco');
  const resolvedPath = path.resolve(process.cwd(), searchPath);
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
 * directory itself. Nothing above the working directory is ever looked at.
 */
export function searchGlobalConfig(dir = ''): {
  config: TranslocoGlobalConfig;
  filepath?: string;
} {
  const explorer = cosmiconfigSync('transloco');

  for (const searchDir of searchDirs(dir)) {
    const configSearch = explorer.search(searchDir);

    if (configSearch) {
      return {
        config: unwrapConfig(configSearch),
        filepath: configSearch.filepath,
      };
    }
  }

  return { config: {} };
}

/**
 * The config file a search from the directory finds, `undefined` when there
 * is none. The search goes up through the parent directories until it has
 * looked in the first one holding a `package.json`, which is the root of the
 * project the directory belongs to. An empty file isn't found, the way it
 * isn't by `getGlobalConfig`.
 */
export function findGlobalConfigFile(dir = ''): string | undefined {
  return cosmiconfigSync('transloco', { searchStrategy: 'project' }).search(
    path.resolve(process.cwd(), dir),
  )?.filepath;
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

/**
 * The directory, then its parents up to the working directory. A directory
 * that is not below the working directory is followed by the working directory
 * alone, which is what walking up to the filesystem root without meeting it
 * means.
 */
function searchDirs(dir: string): string[] {
  const cwd = process.cwd();
  const start = path.resolve(cwd, dir);
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
