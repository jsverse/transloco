import { existsSync } from 'node:fs';

import { CliError } from '../errors.js';

/**
 * Fails when the `--config` that was typed points at nothing.
 *
 * The loader takes a path that isn't there for a directory without a config
 * and comes back empty, so the command would carry on with its defaults, as if
 * no config had been asked for. A directory is fine, it is searched for a
 * config. The path is resolved against the working directory, which `--cwd`
 * has changed by the time a command runs.
 */
export function assertConfigPathExists(config: string | undefined) {
  if (config !== undefined && !existsSync(config)) {
    throw new CliError(`error: the --config path does not exist: ${config}`);
  }
}
