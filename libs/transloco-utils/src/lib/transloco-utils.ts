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

  if (!configSearch) {
    return {};
  }

  const { config } = configSearch;

  // cosmiconfig 10+ no longer unwraps the default export of a TS config.
  return config && typeof config === 'object' && 'default' in config
    ? config.default
    : config;
}

function isFile(filePath: string): boolean {
  return statSync(filePath, { throwIfNoEntry: false })?.isFile() ?? false;
}
