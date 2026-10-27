import fs from 'fs-extra';

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

  fs.outputFileSync(
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
