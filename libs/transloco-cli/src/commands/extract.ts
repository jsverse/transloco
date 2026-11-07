import type { Config } from '../keys-manager/types';
import { assertKeysManagerPeers } from '../peers';

import { assertConfigPathExists } from './config-path';

export async function runExtract(config: Partial<Config>) {
  assertConfigPathExists(config.config);
  assertKeysManagerPeers('extract');

  const { buildTranslationFiles } =
    await import('../keys-manager/keys-builder');

  await buildTranslationFiles(config as Config);
}
