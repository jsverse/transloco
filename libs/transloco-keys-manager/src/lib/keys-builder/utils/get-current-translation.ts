import { unflatten } from 'flat';
import fs from 'fs-extra';
import { po } from 'gettext-parser';

import { getConfig } from '../../config';
import { FileFormats, Translation } from '../../types';
import { getLogger } from '../../utils/logger';

/**
 * `JSON.parse` keeps `__proto__` as an own key, so a translation file can carry
 * one at any depth. Drop it in place and report whether anything was removed.
 */
function stripProtoKeys(value: unknown): boolean {
  if (value === null || typeof value !== 'object') return false;

  let dropped = false;
  if (!Array.isArray(value) && Object.hasOwn(value, '__proto__')) {
    delete (value as Record<string, unknown>)['__proto__'];
    dropped = true;
  }

  for (const child of Object.values(value)) {
    if (stripProtoKeys(child)) dropped = true;
  }

  return dropped;
}

function sanitize(
  translation: Translation,
  path: string,
  alreadyDropped = false,
): Translation {
  if (stripProtoKeys(translation) || alreadyDropped) {
    getLogger().warn(
      `Dropped the "__proto__" key from "${path}". It is not a valid translation key.`,
    );
  }

  return translation;
}

function parseJson(path: string): Translation {
  return sanitize(fs.readJsonSync(path, { throws: false }) || {}, path);
}

function parsePot(path: string) {
  try {
    const file = fs.readFileSync(path, 'utf8');
    const parsed = po.parse(file, 'utf8');

    if (!Object.keys(parsed.translations).length) {
      return {};
    }

    // gettext-parser assigns entries by msgid, so a `__proto__` msgid swaps the
    // prototype of its container instead of becoming a key.
    const droppedByParser = [
      parsed.translations,
      ...Object.values(parsed.translations),
    ].some(
      (container) => Object.getPrototypeOf(container) !== Object.prototype,
    );

    const value = Object.keys(parsed.translations[''])
      .filter((key) => key.length > 0)
      .reduce(
        (acc, key) => {
          return {
            ...acc,
            [key]: parsed.translations[''][key].msgstr.pop()!,
          };
        },
        {} as Record<string, string>,
      );

    return sanitize(
      getConfig().unflat
        ? unflatten<Record<string, string>, Translation>(value, {
            object: true,
          })
        : value,
      path,
      droppedByParser,
    );
  } catch (e: any) {
    if (e.code === 'ENOENT') {
      return {};
    }

    console.warn(
      'Something is wrong with the provided file at "%s":',
      path,
      e.message,
    );

    return {};
  }
}

const parsers: Record<FileFormats, (path: string) => Translation> = {
  json: parseJson,
  pot: parsePot,
};

interface GetTranslationsOptions {
  path: string;
  fileFormat: FileFormats;
}

export function getCurrentTranslation({
  path,
  fileFormat,
}: GetTranslationsOptions): Translation {
  return parsers[fileFormat](path);
}
