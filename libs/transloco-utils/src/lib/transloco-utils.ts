import { cosmiconfigSync } from 'cosmiconfig';
import path from 'path';
import {TranslocoGlobalConfig} from "./transloco-utils.types";

/**
 * @deprecated use getGlobalConfig instead.
 */
export function getConfig(searchPath?: string): TranslocoGlobalConfig {
  return getGlobalConfig(searchPath);
}

export function getGlobalConfig(searchPath?: string): TranslocoGlobalConfig {
  if (!searchPath) {
    return {};
  }

  const explorer = cosmiconfigSync('transloco');
  const resolvedPath = path.resolve(process.cwd(), searchPath);
  const configSearch = explorer.search(resolvedPath);

  return configSearch ? configSearch.config : {};
}
