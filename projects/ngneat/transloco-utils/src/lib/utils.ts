import { TranslocoConfig } from './types';
const { cosmiconfigSync } = require('cosmiconfig');

export function getConfig(path?: string): TranslocoConfig {
  const explorer = cosmiconfigSync('transloco');
  if (path) {
    path = `${process.cwd()}/${path}`;
  }
  const configSearch = explorer.search(path);

  return configSearch ? configSearch.config : {};
}
