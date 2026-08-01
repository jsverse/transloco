import { flatten, unflatten } from 'flat';
import { po } from 'gettext-parser';

import { getConfig } from '../../config';
import { FileFormats, Translation } from '../../types';
import { mergeDeep, stringify } from '../../utils/object.utils';

import { removeExtraKeys } from './remove-extra-keys';

interface CreateTranslationOptions {
  currentTranslation: Translation;
  translation: Translation;
  replace: boolean;
  removeExtraKeys: boolean;
  fileFormat: FileFormats;
}

function resolveTranslation({
  currentTranslation,
  translation,
  replace,
  removeExtraKeys: removeExtraKeysParam,
}: CreateTranslationOptions): Translation {
  if (replace) {
    return mergeDeep({}, translation);
  }

  if (removeExtraKeysParam) {
    currentTranslation = removeExtraKeys(currentTranslation, translation);
  }

  return mergeDeep({}, translation, currentTranslation);
}

function createJson(config: CreateTranslationOptions) {
  const { translation } = config;

  return stringify(
    resolveTranslation({
      ...config,
      translation: getConfig().unflat
        ? unflatten(translation, { object: true })
        : translation,
    }),
  );
}

function createPot(config: CreateTranslationOptions) {
  const resolved: Translation = getConfig().unflat
    ? flatten(resolveTranslation(config))
    : resolveTranslation(config);

  return po
    .compile({
      charset: 'utf-8',
      headers: {
        'mime-version': '1.0',
        'content-type': 'text/plain; charset=utf-8',
        'content-transfer-encoding': '8bit',
      },
      translations: {
        '': Object.entries(resolved).reduce(
          (acc, [msgid, msgstr]) => ({
            ...acc,
            [msgid]: { msgid, msgstr },
          }),
          {},
        ),
      },
    })
    .toString('utf8');
}

const compilers: Record<
  FileFormats,
  (config: CreateTranslationOptions) => string
> = {
  json: createJson,
  pot: createPot,
};

export function createTranslation(config: CreateTranslationOptions): string {
  return compilers[config.fileFormat](config);
}
