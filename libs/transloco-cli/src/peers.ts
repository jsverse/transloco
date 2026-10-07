import { createRequire } from 'node:module';

import { CliError } from './errors.js';
import { packageJsonPath, readPackageJson } from './package-info.js';

/**
 * Only the keys manager needs these, so the package marks them as optional
 * peers and the commands running it verify them instead.
 */
const keysManagerPeers = ['@angular/compiler', 'typescript'];

type ResolvePeer = (name: string) => unknown;

/**
 * Fails with an actionable message when a peer of the keys manager is missing.
 *
 * The peers are resolved from the package and not from the working directory,
 * since that's where the keys manager is going to load them from.
 */
export function assertKeysManagerPeers(
  command: string,
  resolve: ResolvePeer = createRequire(packageJsonPath).resolve,
) {
  const missing = keysManagerPeers.filter(
    (peer) => !isInstalled(peer, resolve),
  );

  if (missing.length === 0) return;

  const ranges = readPackageJson().peerDependencies;
  const several = missing.length > 1;
  const specs = missing.map((peer) => `"${peer}@${toNpmRange(ranges[peer])}"`);

  throw new CliError(
    [
      `error: "transloco ${command}" needs ${missing.join(' and ')}, which ${
        several ? 'are' : 'is'
      } not installed.`,
      ...missing.map((peer) => `  ${peer} supported range: ${ranges[peer]}`),
      `Install ${several ? 'them' : 'it'} in your project: npm install --save-dev ${specs.join(' ')}`,
    ].join('\n'),
  );
}

function isInstalled(peer: string, resolve: ResolvePeer) {
  try {
    resolve(peer);

    return true;
  } catch (error) {
    // Any other failure means the package is there, e.g. one `require` can't resolve.
    return (error as NodeJS.ErrnoException).code !== 'MODULE_NOT_FOUND';
  }
}

/** `>= 20.0.0 < 23.0.0` => `>=20.0.0 <23.0.0`, the form a package spec takes. */
function toNpmRange(range: string) {
  return range.replace(/([<>=~^]+)\s+/g, '$1');
}
