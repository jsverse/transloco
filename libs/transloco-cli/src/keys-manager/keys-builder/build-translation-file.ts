import fs from 'node:fs';

import { outputFile } from '../../utils/file-system.js';
import { Config, Translation } from '../types.js';

import { createTranslation } from './utils/create-translation.js';
import { getCurrentTranslation } from './utils/get-current-translation.js';

export interface FileAction {
  path: string;
  type: 'new' | 'modified';
}

interface BuildTranslationOptions
  extends
    Required<Pick<Config, 'fileFormat'>>,
    Partial<Pick<Config, 'replace' | 'removeExtraKeys'>> {
  path: string;
  translation?: Translation;
}

export function buildTranslationFile({
  path,
  translation = {},
  replace = false,
  removeExtraKeys = false,
  fileFormat,
}: BuildTranslationOptions): FileAction {
  const fileExists = fs.existsSync(path);
  const currentTranslation = getCurrentTranslation({ path, fileFormat });

  outputFile(
    path,
    createTranslation({
      currentTranslation,
      translation,
      replace,
      removeExtraKeys,
      fileFormat,
    }),
  );

  return { type: fileExists ? 'modified' : 'new', path };
}
