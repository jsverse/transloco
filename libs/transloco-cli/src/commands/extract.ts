import type { Config } from '../keys-manager/types.js';
import { assertKeysManagerPeers } from '../peers.js';

import { assertConfigPathExists } from './config-path.js';

export async function runExtract(config: Partial<Config>) {
  assertConfigPathExists(config.config);
  assertKeysManagerPeers('extract');

  const { buildTranslationFiles } =
    await import('../keys-manager/keys-builder/index.js');

  await buildTranslationFiles(config as Config);
}
