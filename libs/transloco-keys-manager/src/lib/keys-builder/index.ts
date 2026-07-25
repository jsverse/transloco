import { setConfig } from '../config';
import { messages } from '../messages';
import { Config } from '../types';
import { countKeys } from '../utils/keys.utils';
import { getLogger } from '../utils/logger';
import { resolveConfig } from '../utils/resolve-config';

import { buildKeys } from './build-keys';
import { createTranslationFiles } from './create-translation-files';

/** The main function, collects the settings and starts the files build. */
export async function buildTranslationFiles(inlineConfig: Config) {
  const logger = getLogger();
  const config = resolveConfig(inlineConfig);
  setConfig(config);

  logger.log(
    '\x1b[4m%s\x1b[0m',
    `\n${messages.startBuild(config.langs.length)} 👷🏗\n`,
  );
  logger.startSpinner(`${messages.extract} 🗝`);

  const result = buildKeys(config);
  const { scopeToKeys, fileCount } = result;

  logger.success(`${messages.extract} 🗝`);

  let keysFound = 0;
  for (const [_, scopeKeys] of Object.entries(scopeToKeys)) {
    keysFound += countKeys(scopeKeys as object);
  }

  logger.log(
    '\x1b[34m%s\x1b[0m',
    'ℹ',
    messages.keysFound(keysFound, fileCount),
  );

  await createTranslationFiles({
    scopeToKeys,
    ...config,
  });
}
