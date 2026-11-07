import type { Config } from '../keys-manager/types';
import { assertKeysManagerPeers } from '../peers';

import { assertConfigPathExists } from './config-path';

export async function runFind(config: Partial<Config>) {
  assertConfigPathExists(config.config);
  assertKeysManagerPeers('find');

  const { findMissingKeys } = await import('../keys-manager/keys-detective');

  findMissingKeys(config as Config);
}
