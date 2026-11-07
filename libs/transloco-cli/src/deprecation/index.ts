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
 * Writes the notice straight to stderr, so that it is the first line there.
 * `process.emitWarning` would defer it and add a process id. Node's own
 * `--no-deprecation` silences it. The write is synchronous for files, TTYs and
 * Windows pipes. A POSIX pipe takes the line at once while it has room, but
 * when the pipe is already full Node queues it, and a bin that exits right
 * after can drop it. `fs.writeSync(2)` would throw EAGAIN there instead.
 *
 * @param command The first argument of `transloco-keys-manager`, which picks the replacement.
 */
export function warnDeprecatedBin(bin: LegacyBin, command?: string) {
  if (process.noDeprecation) {
    return;
  }

  process.stderr.write(formatDeprecationNotice(bin, command));
}
