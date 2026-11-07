import type { Config } from '../keys-manager/types.js';
import { assertKeysManagerPeers } from '../peers.js';

import { assertConfigPathExists } from './config-path.js';

export async function runFind(config: Partial<Config>) {
  assertConfigPathExists(config.config);
  assertKeysManagerPeers('find');

  const { findMissingKeys } =
    await import('../keys-manager/keys-detective/index.js');

  findMissingKeys(config as Config);
}
