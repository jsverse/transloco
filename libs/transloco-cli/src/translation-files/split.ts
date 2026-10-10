import { join } from 'node:path';

import {
  findTranslationFiles,
  getScopeEntries,
  getTranslationKey,
  languageOf,
  readJson,
  toJson,
  type PlannedFile,
  type Translation,
  type TranslationFileReader,
} from './shared.js';

export interface SplitOptions {
  /** The folder of the root translation files. */
  root: string;
  /** The folder of the joined files. */
  source: string;
  /** The folder of each scope, when the scopes are not the folders of the root. */
  scopePathMap?: Record<string, string>;
}

/**
 * Hands the translations of every scope back to the file of its folder, and what
 * is left of a joined file to the root file of the language.
 *
 * Only the files that exist are written. The translations of a scope whose
 * folder holds no file for the language are dropped, those of a folder with no
 * files at all stay with the root file. A language with no root file, and a root
 * file of a language that wasn't joined, are left as they are.
 *
 * @returns the files to write, in the order to write them
 */
export function splitTranslations(
  reader: TranslationFileReader,
  { root, source, scopePathMap }: SplitOptions,
): PlannedFile[] {
  const entries = getScopeEntries(reader, root, scopePathMap);
  const files: PlannedFile[] = [];
  const remaining = new Map<string, Translation>();

  for (const fileName of findTranslationFiles(reader, source)) {
    const lang = languageOf(fileName);
    const translation: Translation = readJson(reader, join(source, fileName));

    for (const { scope, path: scopePath } of entries) {
      splitScope(reader, scopePath, translation, lang, scope, files);
    }

    remaining.set(lang, translation);
  }

  for (const fileName of findTranslationFiles(reader, root)) {
    const translation = remaining.get(languageOf(fileName));

    if (translation) {
      files.push({ path: join(root, fileName), content: toJson(translation) });
    }
  }

  return files;
}

function splitScope(
  reader: TranslationFileReader,
  dir: string,
  translation: Translation,
  lang: string,
  key: string,
  files: PlannedFile[],
) {
  const fileNames = reader.listFiles(dir);

  if (!fileNames.length) return;

  for (const subDir of reader.listDirs(dir)) {
    const nestedKeyPath = getTranslationKey(key, subDir);
    const nestedKey = nestedKeyPath.split('.').at(-1) ?? nestedKeyPath;
    const scopeTranslation = translation[key];

    if (scopeTranslation) {
      splitScope(
        reader,
        join(dir, subDir),
        scopeTranslation,
        lang,
        nestedKey,
        files,
      );
      delete translation[key][nestedKey];
    }
  }

  for (const fileName of fileNames) {
    if (!fileName.includes(`${lang}.json`) || !translation[key]) continue;

    files.push({
      path: join(dir, fileName),
      content: toJson(translation[key]),
    });
  }

  delete translation[key];
}
