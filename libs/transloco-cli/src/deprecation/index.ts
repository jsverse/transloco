// Internal entry point for the legacy tool bins, which print the notice when they start. Not a public API.
// Loaded by every one of them before it does anything else, so it imports nothing.

export type LegacyBin =
  | 'transloco-keys-manager'
  | 'transloco-validator'
  | 'transloco-optimize'
  | 'transloco-scoped-libs';

const replacements: Record<LegacyBin, string> = {
  'transloco-keys-manager': 'transloco',
  'transloco-validator': 'transloco validate',
  'transloco-optimize': 'transloco optimize',
  'transloco-scoped-libs': 'transloco scoped-libs',
};
const keysManagerCommands = ['extract', 'find'];

function formatDeprecationNotice(bin: LegacyBin, command?: string) {
  const replacement =
    bin === 'transloco-keys-manager' &&
    command &&
    keysManagerCommands.includes(command)
      ? `transloco ${command}`
      : replacements[bin];

  return `DeprecationWarning: ${bin} is deprecated and will be removed in Transloco v10. Run "${replacement}" from @jsverse/transloco-cli instead.\n`;
}

/**
 * Writes the notice synchronously, so that it is the first line on stderr and
 * survives a bin that exits or throws right after. `process.emitWarning` would
 * defer it and add a process id. Node's own `--no-deprecation` silences it.
 *
 * @param command The first argument of `transloco-keys-manager`, which picks the replacement.
 */
export function warnDeprecatedBin(bin: LegacyBin, command?: string) {
  if (process.noDeprecation) {
    return;
  }

  process.stderr.write(formatDeprecationNotice(bin, command));
}
