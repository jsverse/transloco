import { unflatten } from 'flat';
import fs from 'fs-extra';
import { po } from 'gettext-parser';

import { getConfig } from '../../config';
import { FileFormats, Translation } from '../../types';

function parseJson(path: string): Translation {
  return fs.readJsonSync(path, { throws: false }) || {};
}

function parsePot(path: string) {
  try {
    const file = fs.readFileSync(path, 'utf8');
    const parsed = po.parse(file, 'utf8');

    if (!Object.keys(parsed.translations).length) {
      return {};
    }

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

    return getConfig().unflat
      ? unflatten<Record<string, string>, Translation>(value, {
          object: true,
        })
      : value;
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
