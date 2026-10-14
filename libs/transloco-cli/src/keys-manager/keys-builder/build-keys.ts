import { Config, ScopeMap } from '../types.js';
import { checkForProblematicUnflatKeys } from '../utils/keys.utils.js';
import { mergeDeep } from '../utils/object.utils.js';

import { extractTemplateKeys } from './template/index.js';
import { extractTSKeys } from './typescript/index.js';

export function buildKeys(config: Config) {
  const [template, ts] = [extractTemplateKeys(config), extractTSKeys(config)];

  const scopeToKeys = mergeDeep(
    {},
    template.scopeToKeys,
    ts.scopeToKeys,
  ) as ScopeMap;
  const fileCount = template.fileCount + ts.fileCount;

  if (config.unflat) {
    for (const scopeKeys of Object.values(scopeToKeys)) {
      checkForProblematicUnflatKeys(scopeKeys);
    }
  }

  return { scopeToKeys, fileCount };
}
