import * as path from 'node:path';

import { cosmiconfigSync } from 'cosmiconfig';

import { TranslocoGlobalConfig } from './transloco-utils.types';

export function getGlobalConfig(searchPath = ''): TranslocoGlobalConfig {
  const explorer = cosmiconfigSync('transloco');
  const resolvedPath = path.resolve(process.cwd(), searchPath);
  const configSearch = explorer.search(resolvedPath);

  return configSearch ? configSearch.config : {};
}
