import fs from 'node:fs';
import path from 'node:path';

import { cosmiconfigSync, getDefaultSearchPlacesSync } from 'cosmiconfig';

import { fileNamedIn, oneLine } from '../config/load-error.js';

const moduleName = 'transloco';

export interface UnreadableConfig {
  /** The file that could not be read, when it is known. */
  file?: string;
  /** Why, in a single line. */
  reason: string;
}

/**
 * Names the file a failed search for a Transloco config choked on. The search
 * reports a failure without the file whenever it is a script, so the places it
 * looks in are tried again, in its order, from the directory up to the first
 * one holding a `package.json`. A failure that none of them reproduces is
 * described as it was reported.
 */
export function findUnreadableConfig(
  failure: unknown,
  dir = process.cwd(),
): UnreadableConfig {
  let explorer: ReturnType<typeof cosmiconfigSync>;

  try {
    explorer = cosmiconfigSync(moduleName);
  } catch (error) {
    // Making the explorer reads the settings of cosmiconfig itself, from the
    // package.json of the working directory
    return describe(error);
  }

  const places = getDefaultSearchPlacesSync(moduleName);

  for (let current = path.resolve(dir); ;) {
    for (const place of places) {
      const file = path.join(current, place);

      if (!isFile(file)) continue;

      try {
        explorer.load(file);
      } catch (error) {
        return { file, reason: oneLine(file, error) };
      }
    }

    const parent = path.dirname(current);

    if (parent === current || isFile(path.join(current, 'package.json'))) {
      return describe(failure);
    }

    current = parent;
  }
}

function describe(error: unknown): UnreadableConfig {
  const file = fileNamedIn(error);

  return { file, reason: oneLine(file, error) };
}

function isFile(file: string) {
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
}
