import { setConfig } from '../config.js';
import { buildKeys } from '../keys-builder/build-keys.js';
import { messages } from '../messages.js';
import { Config } from '../types.js';
import { getLogger } from '../utils/logger.js';
import { resolveConfig } from '../utils/resolve-config.js';

import { compareKeysToFiles } from './compare-keys-to-files.js';
import { getTranslationFilesPath } from './get-translation-files-path.js';

export function findMissingKeys(inlineConfig: Config) {
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
    return;
  }

  logger.log('\n 🕵 🔎', `\x1b[4m${messages.startSearch}\x1b[0m`, '🔍 🕵\n');
  logger.startSpinner(`${messages.extract} `);

  const result = buildKeys(config);
  logger.success(`${messages.extract} 🗝`);

  const { addMissingKeys, emitErrorOnExtraKeys, unflat } = config;
  compareKeysToFiles({
    scopeToKeys: result.scopeToKeys,
    translationsPath,
    addMissingKeys,
    emitErrorOnExtraKeys,
    fileFormat,
    unflat,
  });
}
