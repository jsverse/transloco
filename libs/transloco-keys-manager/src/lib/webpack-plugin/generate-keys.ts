import { basename } from 'node:path';

import { TranslocoGlobalConfig } from '@jsverse/transloco-utils';
import { unflatten } from 'flat';
import { sync as globSync } from 'glob';

import { ScopeMap, Config } from '../types';
import { readFile, writeFile } from '../utils/file.utils';
import { mergeDeep } from '../utils/object.utils';

type Params = {
  translationPath: string;
  scopeToKeys: ScopeMap;
  config: Config & TranslocoGlobalConfig;
};

function filterLangs(config: Params['config']) {
  return function (path: string) {
    return config.langs.find(
      (lang) => lang === basename(path).replace(`.${config.fileFormat}`, ''),
    );
  };
}

/**
 * In use in the Webpack Plugin
 */
export function generateKeys({ translationPath, scopeToKeys, config }: Params) {
  const scopePaths = config.scopePathMap || {};

  const result = [];

  for (const [scope, path] of Object.entries(scopePaths)) {
    const keys = scopeToKeys[scope];
    if (keys) {
      result.push({
        keys,
        files: globSync(`${path}/*.${config.fileFormat}`).filter(
          filterLangs(config),
        ),
      });
    }
  }

  for (const [scope, keys] of Object.entries(scopeToKeys)) {
    if (keys) {
      const isGlobal = scope === '__global';

      result.push({
        keys,
        files: globSync(
          `${translationPath}/${isGlobal ? '' : scope}*.${config.fileFormat}`,
        ).filter(filterLangs(config)),
      });
    }
  }

  for (const { files, keys: extractedKeys } of result) {
    const keys = config.unflat ? unflatten(extractedKeys) : extractedKeys;
    for (const filePath of files) {
      const translation = readFile(filePath, { parse: true });
      writeFile(filePath, mergeDeep({}, keys, translation));
    }
  }
}
