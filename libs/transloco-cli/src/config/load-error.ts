// Namespace imports, as the schematics load this module through a plain `require`
import * as fs from 'node:fs';
import * as path from 'node:path';

import { cosmiconfigSync, getDefaultSearchPlacesSync } from 'cosmiconfig';

import { CliError } from '../errors.js';
import { specialKind } from '../utils/real-path.js';

const moduleName = 'transloco';
/** How cosmiconfig puts the file in front of the reason, when that file is JSON. */
const jsonError = /^JSON Error in (.+):\n/;

/** A config file that could not be loaded, which names the file along with why. */
export class ConfigLoadError extends CliError {
  constructor(
    /** The absolute path of the file. */
    readonly file: string,
    /** Why, in a single line. */
    readonly reason: string,
  ) {
    super(
      `Transloco: could not load the config ${path.relative('', file) || file}: ${reason}`,
    );
    this.name = 'ConfigLoadError';
  }
}

/**
 * Refuses a path that is there and is neither a regular file nor a folder,
 * links followed: a FIFO, a socket or a device. The readers of a config open
 * what a search finds, which waits for the other end of a FIFO for good and
 * has no end at `/dev/zero`. The path is only looked at, never opened. A folder
 * of that name is left alone, as the search skips it.
 */
export function assertRegularFile(file: string) {
  let stats: fs.Stats;

  try {
    stats = fs.statSync(file);
  } catch {
    // Not there, or not reachable: for whoever reads it to report
    return;
  }

  if (stats.isFile() || stats.isDirectory()) return;

  throw new ConfigLoadError(
    path.resolve(file),
    `it is not a regular file, it is ${specialKind(stats) ?? 'something else'}`,
  );
}

/** Every place in the folder that a search with these places would open. */
export function assertSearchPlacesAreFiles(dir: string, places: string[]) {
  for (const place of places) {
    assertRegularFile(path.join(dir, place));
  }
}

/** The places a search for a Transloco config opens in a folder. */
export function assertConfigPlacesAreFiles(dir: string) {
  assertSearchPlacesAreFiles(dir, getDefaultSearchPlacesSync(moduleName));
}

/**
 * Making an explorer reads the settings of cosmiconfig itself, among others
 * from the `package.json` of the working directory.
 */
export function assertExplorerCanBeMade() {
  assertRegularFile(path.join(process.cwd(), 'package.json'));
}

/**
 * Names the config file a failed load choked on. The loaders of a script
 * report the failure without the file, so the target is loaded again to find
 * it: the file itself when it is one, otherwise the places a search looks in
 * the directory, in its order. A failure that is not reproduced is returned as
 * it was reported.
 */
export function nameConfigFile(failure: unknown, target: string): unknown {
  const file = isFile(target)
    ? path.resolve(target)
    : failingFileIn(path.resolve(target));

  return file === undefined
    ? failure
    : new ConfigLoadError(file, oneLine(file, failure));
}

/** The reason in a single line, without the `JSON Error in <file>:` the JSON loader puts in front. */
export function oneLine(file: string | undefined, error: unknown) {
  return message(error)
    .replace(file === undefined ? '' : `JSON Error in ${file}:`, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The file a JSON loader names in its failure, if it is one. */
export const fileNamedIn = (error: unknown) =>
  jsonError.exec(message(error))?.[1];

const message = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

function failingFileIn(dir: string) {
  let explorer: ReturnType<typeof cosmiconfigSync>;

  try {
    explorer = cosmiconfigSync(moduleName);
  } catch {
    return undefined;
  }

  for (const place of getDefaultSearchPlacesSync(moduleName)) {
    const file = path.join(dir, place);

    if (!isFile(file)) continue;

    try {
      explorer.load(file);
    } catch {
      return file;
    }
  }

  return undefined;
}

function isFile(file: string) {
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
}
