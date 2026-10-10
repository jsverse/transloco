import { applyEdits, modify } from 'jsonc-parser';

import { CliError } from '../errors.js';

const bom = '\uFEFF';

export interface Manifest {
  /** The scripts that are already there, with their values. */
  scripts: Record<string, unknown>;
}

/** Reads the `package.json`, or refuses it when scripts cannot be added to what it holds. */
export function parseManifest(text: string): Manifest {
  let manifest: unknown;

  try {
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
 * else as it was: the indentation, the line endings, the BOM, the order of the
 * keys and whether the file ends with a line break.
 */
export function addScripts(text: string, scripts: Record<string, string>) {
  const hasBom = text.startsWith(bom);
  const indent = /^([ \t]+)"/m.exec(text)?.[1];
  // A file on a single line stays on it
  const formattingOptions = indent
    ? {
        insertSpaces: !indent.startsWith('\t'),
        tabSize: indent.startsWith('\t') ? 1 : indent.length,
      }
    : undefined;
  let result = hasBom ? text.slice(bom.length) : text;

  for (const [name, command] of Object.entries(scripts)) {
    result = applyEdits(
      result,
      modify(result, ['scripts', name], command, { formattingOptions }),
    );
  }

  return hasBom ? `${bom}${result}` : result;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
