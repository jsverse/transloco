import { applyEdits, modify } from 'jsonc-parser';

import { CliError } from '../errors.js';

export interface Manifest {
  /** The scripts that are already there, with their values. */
  scripts: Record<string, unknown>;
}

/** Reads the `package.json`, or refuses it when scripts cannot be added to what it holds. */
export function parseManifest(text: string): Manifest {
  let manifest: unknown;

  try {
    // A BOM is let through: the search for a config can't read such a file
    // either, and `init` reports that, with its reason, where it looks for one.
    manifest = JSON.parse(text.replace(/^\uFEFF/, ''));
  } catch (error) {
    throw new CliError(
      `Transloco Init: package.json is not valid JSON: ${(error as Error).message}`,
    );
  }

  if (!isObject(manifest)) {
    throw new CliError(`Transloco Init: package.json does not hold an object`);
  }

  const { scripts = {} } = manifest;

  if (!isObject(scripts)) {
    throw new CliError(
      `Transloco Init: the scripts of package.json are not an object`,
    );
  }

  return { scripts };
}

/**
 * Adds the scripts to the text of the `package.json` and leaves everything
 * else as it was: the indentation, the line endings, the order of the keys and
 * whether the file ends with a line break.
 */
export function addScripts(text: string, scripts: Record<string, string>) {
  const indent = /^([ \t]+)"/m.exec(text)?.[1];
  // A file on a single line stays on it
  const formattingOptions = indent
    ? {
        insertSpaces: !indent.startsWith('\t'),
        tabSize: indent.startsWith('\t') ? 1 : indent.length,
      }
    : undefined;
  let result = text;

  for (const [name, command] of Object.entries(scripts)) {
    result = applyEdits(
      result,
      modify(result, ['scripts', name], command, { formattingOptions }),
    );
  }

  return result;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
