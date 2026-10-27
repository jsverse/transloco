import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import { CliError } from '../errors.js';

/**
 * Fails when the `--config` that was typed points at nothing, or at a
 * directory holding no Transloco config.
 *
 * The loader takes a path that isn't there, or a directory without a config,
 * and comes back empty, so the command would carry on with its defaults, as if
 * no config had been asked for. A directory is searched for a config, the
 * places of the search are only looked at here, never loaded. The path is
 * resolved against the working directory, which `--cwd` has changed by the
 * time a command runs.
 */
export function assertConfigPathExists(config: string | undefined) {
  if (config === undefined) return;

  if (!existsSync(config)) {
    throw new CliError(`error: the --config path does not exist: ${config}`);
  }

  if (isDirectory(config) && !holdsConfig(config)) {
    throw new CliError(
      `error: the --config folder holds no Transloco config: ${config}`,
    );
  }
}

const rcExtensions = ['', '.json', '.yaml', '.yml', '.js', '.ts', '.cjs'];

/**
 * The places cosmiconfig's search looks at in a folder, the ones of
 * `getDefaultSearchPlacesSync('transloco')`. Cosmiconfig isn't imported here,
 * so that a command loads it only once it reads the config.
 */
export const configSearchPlaces = [
  'package.json',
  ...rcExtensions.map((ext) => `.translocorc${ext}`),
  ...rcExtensions.map((ext) => `.config/translocorc${ext}`),
  'transloco.config.js',
  'transloco.config.ts',
  'transloco.config.cjs',
];

function isDirectory(dir: string) {
  try {
    return statSync(dir).isDirectory();
  } catch {
    return false;
  }
}

/** Whether a search of the directory finds a config, a `package.json` only with a `transloco` key. */
function holdsConfig(dir: string) {
  return configSearchPlaces.some((place) => {
    const file = path.join(dir, place);

    if (!existsSync(file)) return false;
    if (place !== 'package.json') return true;

    try {
      return JSON.parse(readFileSync(file, 'utf8'))?.transloco !== undefined;
    } catch {
      // cosmiconfig reports the broken file when it loads it
      return true;
    }
  });
}
