import fs from 'node:fs';
import path from 'node:path';

/**
 * The file operations of the tools that take more than one `node:fs` call.
 * What they write and what they throw ends up in the translation files and in
 * the output of the commands, which makes both part of their contract.
 */

/** Creates the directory along with the missing ones above it. An existing one is left alone. */
export function makeDir(dir: string) {
  assertValidWindowsPath(dir);
  fs.mkdirSync(dir, { recursive: true });
}

/** Writes the file, creating its directory first when there is none. */
export function outputFile(file: string, data: string) {
  const dir = path.dirname(file);

  if (!fs.existsSync(dir)) {
    makeDir(dir);
  }

  fs.writeFileSync(file, data);
}

/**
 * Reads a JSON file, with or without a BOM.
 *
 * A failure is thrown with the path in front of its message, whether the file
 * can't be read or can't be parsed. With `throws: false` any failure is `null`.
 */
export function readJsonFile(
  file: string,
  { throws = true }: { throws?: boolean } = {},
) {
  try {
    const content = fs.readFileSync(file, 'utf8');

    return JSON.parse(content.replace(/^\uFEFF/, ''));
  } catch (error) {
    if (!throws) {
      return null;
    }

    (error as Error).message = `${file}: ${(error as Error).message}`;

    throw error;
  }
}

/** Writes the value as JSON followed by a line break. */
export function writeJsonFile(file: string, value: unknown, spaces?: number) {
  const json = JSON.stringify(value, null, spaces);

  if (json === undefined) {
    throw new TypeError(
      `Converting ${typeof value} value to JSON is not supported`,
    );
  }

  fs.writeFileSync(file, `${json}\n`, 'utf8');
}

/**
 * Windows creates nothing for a name holding one of these characters and
 * reports an error that doesn't say why, hence the check before asking it to.
 */
function assertValidWindowsPath(dir: string) {
  if (process.platform !== 'win32') return;

  if (/[<>:"|?*]/.test(dir.replace(path.parse(dir).root, ''))) {
    const error: NodeJS.ErrnoException = new Error(
      `Path contains invalid characters: ${dir}`,
    );
    error.code = 'EINVAL';

    throw error;
  }
}
