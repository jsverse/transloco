import fs from 'node:fs';
import path from 'node:path';

import { cosmiconfigSync, getDefaultSearchPlacesSync } from 'cosmiconfig';

import { CliError } from '../errors.js';

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
