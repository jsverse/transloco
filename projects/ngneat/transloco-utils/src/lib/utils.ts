import { TranslocoConfig } from './types';
const cosmiconfig = require('cosmiconfig');

export function getConfig(): TranslocoConfig {
  const explorer = cosmiconfig('transloco');
  const configSearch = explorer.searchSync();

  return configSearch.config;
}
