import { getGlobalConfig } from '@jsverse/transloco-utils';
import type { DiffDeleted, DiffNew } from 'deep-diff';
import df from 'deep-diff';
import { flatten } from 'flat';

import { createTranslation } from '../keys-builder/utils/create-translation';
import { getCurrentTranslation } from '../keys-builder/utils/get-current-translation';
import { messages } from '../messages';
import { Config, KeysDetectiveResult, ScopeMap } from '../types';
import { writeFile } from '../utils/file.utils';
import { getLogger } from '../utils/logger';
import { getScopeAndLangFromPath } from '../utils/path.utils';
import { normalizedGlob } from '../utils/normalize-glob-path';

import { buildTable } from './build-table';
import { getTranslationFilesPath } from './get-translation-files-path';

interface Result {
  keys: Record<string, string>;
  files: string[];
  scope: string;
  baseFilesPath: string;
}

interface CompareKeysOptions extends Pick<
  Config,
  'fileFormat' | 'addMissingKeys' | 'translationsPath'
> {
  scopeToKeys: ScopeMap;
}

export function compareKeysToFiles({
  scopeToKeys,
  translationsPath,
  addMissingKeys,
  fileFormat,
}: CompareKeysOptions): KeysDetectiveResult {
  const logger = getLogger();
  logger.startSpinner(`${messages.checkMissing} ✨`);

  const diffsPerLang: Record<
    string,
    {
      missing: Array<DiffNew<any>>;
      extra: Array<DiffDeleted<any>>;
    }
  > = {};

  /** An array of the existing translation files paths */
  const translationFiles = getTranslationFilesPath(
    translationsPath,
    fileFormat,
  );

  const result: Result[] = [];
  const scopePaths = getGlobalConfig().scopePathMap || {};
  for (const [scope, path] of Object.entries(scopePaths)) {
    const keys = scopeToKeys[scope];
    if (keys) {
      const res: Omit<Result, 'files'> = {
        keys,
        scope,
        baseFilesPath: path,
      };
      result.push({
        ...res,
        files: normalizedGlob(`${res.baseFilesPath}/*.${fileFormat}`),
      });
    }
  }
  const cache: Record<string, boolean> = {};

  for (const filePath of translationFiles) {
    const { scope = '__global' } = getScopeAndLangFromPath({
      filePath,
      translationsPath,
      fileFormat,
    });
    if (cache[scope]) {
      continue;
    }

    cache[scope] = true;
    const keys = scope ? scopeToKeys[scope] : scopeToKeys.__global;
    if (keys) {
      const isGlobal = scope === '__global';
      const res: Omit<Result, 'files'> = {
        keys,
        scope,
        baseFilesPath: translationsPath,
      };
      result.push({
        ...res,
        files: normalizedGlob(
          `${res.baseFilesPath}/${isGlobal ? '' : scope}/*.${fileFormat}`,
        ),
      });
    }
  }

  for (const { files, keys, scope, baseFilesPath } of result) {
    for (const filePath of files) {
      const { lang } = getScopeAndLangFromPath({
        filePath,
        translationsPath: baseFilesPath,
        fileFormat,
      });
      const translation = getCurrentTranslation({ path: filePath, fileFormat });
      // We always build the keys flatten, so we need to make sure we compare to a flat file
      const flat = flatten<Record<string, any>, Record<string, string>>(
        translation,
        {
          safe: true,
        },
      );
      // Compare the current file with the extracted keys
      const differences = df.diff(flat, keys);

      if (differences) {
        const langPath = `${scope !== '__global' ? scope + '/' : ''}${lang}`;

        diffsPerLang[langPath] = {
          missing: [],
          extra: [],
        };

        for (const diff of differences) {
          if (diff.kind === 'N') {
            diffsPerLang[langPath].missing.push(diff);
            if (addMissingKeys) {
              df.applyChange(translation, keys, diff);
            }
          } else if (diff.kind === 'D') {
            const isComment = diff.path!.join('.').endsWith('.comment');
            if (!isComment) {
              diffsPerLang[langPath].extra.push(diff);
            }
          }
        }

        if (addMissingKeys) {
          writeFile(
            filePath,
            createTranslation({
              currentTranslation: {},
              translation,
              replace: true,
              removeExtraKeys: false,
              fileFormat,
            }),
          );
        }
      }
    }
  }

  logger.success(`${messages.checkMissing} ✨`);

  const langs = Object.keys(diffsPerLang).filter((lang) => {
    const { missing, extra } = diffsPerLang[lang];
    return missing.length || extra.length;
  });

  return buildTable({
    langs,
    diffsPerLang,
    addMissingKeys,
  });
}
