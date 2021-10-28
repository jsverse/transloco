import { cosmiconfigSync } from 'cosmiconfig';
import * as path from 'path';
import { TranslocoGlobalConfig } from './transloco-utils.types';

export function getGlobalConfig(
  searchPath: string = ''
): TranslocoGlobalConfig {
  const explorer = cosmiconfigSync('transloco');
  const resolvedPath = path.resolve(process.cwd(), searchPath);
  const configSearch = explorer.search(resolvedPath);

  return configSearch ? configSearch.config : {};
}
