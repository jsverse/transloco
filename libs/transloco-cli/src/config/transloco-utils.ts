import { statSync } from 'node:fs';
import * as path from 'node:path';

import { cosmiconfigSync } from 'cosmiconfig';

import { TranslocoGlobalConfig } from './transloco-utils.types';

export function getGlobalConfig(searchPath = ''): TranslocoGlobalConfig {
  const explorer = cosmiconfigSync('transloco');
  const resolvedPath = path.resolve(process.cwd(), searchPath);
  // cosmiconfig 9+ treats a search path as a directory, so a config file path must be loaded directly.
  const configSearch = isFile(resolvedPath)
    ? explorer.load(resolvedPath)
    : explorer.search(resolvedPath);

  // `load()` reports an empty file as `isEmpty` instead of skipping it like `search()` does.
  if (!configSearch || configSearch.isEmpty) {
    return {};
  }

  const { config, filepath } = configSearch;

  // cosmiconfig 10+ no longer unwraps the default export of a TS config.
  return MODULE_CONFIG.test(filepath) &&
    config &&
    typeof config === 'object' &&
    'default' in config
    ? config.default
    : config;
}

const MODULE_CONFIG = /\.[cm]?[jt]s$/;

// Any stat error (ENOENT, ENOTDIR, EACCES, ...) falls through to `search()`, which reports it as before.
function isFile(filePath: string): boolean {
  try {
    return statSync(filePath).isFile();
  } catch {
    return false;
  }
}
