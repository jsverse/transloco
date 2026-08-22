import { basename } from 'node:path';

import { TranslocoGlobalConfig } from '@jsverse/transloco-utils';
import { sync as globSync } from 'glob';

import { createTranslation } from '../keys-builder/utils/create-translation';
import { getCurrentTranslation } from '../keys-builder/utils/get-current-translation';
import { ScopeMap, Config } from '../types';
import { writeFile } from '../utils/file.utils';

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
  // Scopes with an explicit path must not fall back to the default location.
  const resolvedScopes = new Set<string>();

  for (const [scope, path] of Object.entries(scopePaths)) {
    const keys = scopeToKeys[scope];
    if (keys) {
      resolvedScopes.add(scope);
      result.push({
        keys,
        files: globSync(`${path}/*.${config.fileFormat}`).filter(
          filterLangs(config),
        ),
      });
    }
  }

  for (const [scope, keys] of Object.entries(scopeToKeys)) {
    if (keys && !resolvedScopes.has(scope)) {
      const isGlobal = scope === '__global';

      result.push({
        keys,
        files: globSync(
          `${translationPath}/${isGlobal ? '' : `${scope}/`}*.${
            config.fileFormat
          }`,
        ).filter(filterLangs(config)),
      });
    }
  }

  for (const { files, keys } of result) {
    for (const filePath of files) {
      const currentTranslation = getCurrentTranslation({
        path: filePath,
        fileFormat: config.fileFormat,
      });

      writeFile(
        filePath,
        createTranslation({
          translation: keys,
          currentTranslation,
          replace: false,
          removeExtraKeys: false,
          fileFormat: config.fileFormat,
        }),
      );
    }
  }
}
