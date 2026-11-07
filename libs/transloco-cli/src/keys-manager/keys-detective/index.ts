import { style } from '../../utils/style';
import { setConfig } from '../config';
import { buildKeys } from '../keys-builder/build-keys';
import { messages } from '../messages';
import { Config } from '../types';
import { getLogger } from '../utils/logger';
import { resolveConfig } from '../utils/resolve-config';

import { compareKeysToFiles } from './compare-keys-to-files';
import { getTranslationFilesPath } from './get-translation-files-path';

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

  logger.log('\n 🕵 🔎', style('underline', messages.startSearch), '🔍 🕵\n');
  logger.startSpinner(`${messages.extract} `);

  const result = buildKeys(config);
  logger.success(`${messages.extract} 🗝`);

  const { addMissingKeys, emitErrorOnExtraKeys, unflat, scopePathMap } = config;
  compareKeysToFiles({
    scopeToKeys: result.scopeToKeys,
    translationsPath,
    addMissingKeys,
    emitErrorOnExtraKeys,
    fileFormat,
    unflat,
    scopePathMap,
  });
}
