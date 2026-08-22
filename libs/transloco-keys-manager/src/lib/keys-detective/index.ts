import { setConfig } from '../config';
import { buildKeys } from '../keys-builder/build-keys';
import { messages } from '../messages';
import { Config, KeysDetectiveResult } from '../types';
import { getLogger } from '../utils/logger';
import { resolveConfig } from '../utils/resolve-config';

import { compareKeysToFiles } from './compare-keys-to-files';
import { getTranslationFilesPath } from './get-translation-files-path';

export function findMissingKeys(inlineConfig: Config): KeysDetectiveResult {
  const logger = getLogger();
  const config = resolveConfig(inlineConfig);
  setConfig(config);

  const { translationsPath, fileFormat } = config;
  const translationFiles = getTranslationFilesPath(
    translationsPath,
    fileFormat,
  );

  if (translationFiles.length === 0) {
    console.log('No translation files found.');
    return { hasMissingKeys: false, hasExtraKeys: false };
  }

  logger.log('\n 🕵 🔎', `\x1b[4m${messages.startSearch}\x1b[0m`, '🔍 🕵\n');
  logger.startSpinner(`${messages.extract} `);

  const result = buildKeys(config);
  logger.success(`${messages.extract} 🗝`);

  const { addMissingKeys, unflat } = config;

  return compareKeysToFiles({
    scopeToKeys: result.scopeToKeys,
    translationsPath,
    addMissingKeys,
    fileFormat,
    unflat,
  });
}
