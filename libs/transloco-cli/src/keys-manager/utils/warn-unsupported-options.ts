import { commandSpecificOptions } from '../cli-options';
import { messages } from '../messages';
import { Config } from '../types';

import { getLogger } from './logger';

/**
 * Warns about options the invoked command doesn't read.
 *
 * `cliOptions` must be the raw `commandLineArgs` result and not the resolved
 * config: options that weren't passed are missing from it entirely, which is
 * what tells us the user typed the flag for *this* command. The same key coming
 * from `transloco.config.js` is legitimate, since one config file serves both
 * commands, so it has to stay silent.
 */
export function warnUnsupportedOptions(
  command: Config['command'],
  cliOptions: Record<string, unknown>,
) {
  const unsupported = Object.keys(cliOptions).filter(
    (option) =>
      commandSpecificOptions[option] &&
      commandSpecificOptions[option] !== command,
  );

  if (unsupported.length === 0) return;

  getLogger().warn(
    messages.unsupportedOptions(command, unsupported.map(toFlag)),
  );
}

function toFlag(option: string) {
  return `--${option.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}`;
}
