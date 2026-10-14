import { join } from 'node:path';

import {
  findTranslationFiles,
  getScopeEntries,
  getTranslationKey,
  languageOf,
  planRewrite,
  readJson,
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
 * It undoes the join: a scope folder nested in another one gets back the key
 * join gave it, `scope.nested`, at any depth.
 *
 * Only the files that exist are written. The translations of a scope whose
 * folder holds no file for the language are dropped, those of a folder with no
 * files at all stay with the root file. A language with no root file, and a root
 * file of a language that wasn't joined, are left as they are.
 *
 * A file that already holds what it would be given is left out, and one that
 * changes keeps ending with a line break, or not, as it did.
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
      pushRewrite(reader, files, join(root, fileName), translation);
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
  const scopeValue = own(translation, key);

  // The nested folders go first, so that what is left under the key is the
  // part of this scope alone.
  for (const subDir of reader.listDirs(dir)) {
    const nestedKey = getTranslationKey(key, subDir);
    const nestedDir = join(dir, subDir);

    // A nested folder is keyed beside its scope, `scope.nested`, the way join
    // writes it. Before join did, split took it from inside the scope,
    // `scope: { nested: … }`, which still works when there is no such key.
    const nestedInScope =
      own(translation, nestedKey) === undefined &&
      holdsLanguage(reader, nestedDir, lang) &&
      isObject(scopeValue) &&
      own(scopeValue, subDir) !== undefined;

    if (nestedInScope) {
      splitScope(reader, nestedDir, scopeValue, lang, subDir, files);
    } else {
      splitScope(reader, nestedDir, translation, lang, nestedKey, files);
    }
  }

  const fileNames = reader.listFiles(dir);

  if (!fileNames.length) return;

  for (const fileName of fileNames) {
    if (fileName.includes(`${lang}.json`) && scopeValue) {
      pushRewrite(reader, files, join(dir, fileName), scopeValue);
    }
  }

  delete translation[key];
}

function pushRewrite(
  reader: TranslationFileReader,
  files: PlannedFile[],
  path: string,
  value: Translation,
) {
  const file = planRewrite(reader, path, value);

  if (file) files.push(file);
}

/** The value of the key, leaving out what an object inherits. */
const own = (value: Translation, key: string) =>
  Object.hasOwn(value, key) ? value[key] : undefined;

const isObject = (value: unknown): value is Translation =>
  typeof value === 'object' && value !== null;

const holdsLanguage = (
  reader: TranslationFileReader,
  dir: string,
  lang: string,
) =>
  reader.listFiles(dir).some((fileName) => fileName.includes(`${lang}.json`));
