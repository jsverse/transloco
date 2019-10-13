import { TranslocoConfig } from './types';
const cosmiconfig = require('cosmiconfig');

export function getConfig(): TranslocoConfig {
  const explorer = cosmiconfig('transloco');
  let configSearch;
  try {
    configSearch = explorer.searchSync();
  } catch (e) {
    throw new Error('Could not find transloco.config.js, please create one and try again.');
  }

  return configSearch.config;
}
