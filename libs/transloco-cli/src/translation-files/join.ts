import { join } from 'node:path';

import {
  findTranslationFiles,
  getScopeEntries,
  getTranslationKey,
  isLanguageFile,
  languageOf,
  readJsonObject,
  toJson,
  TranslationFilesError,
  type PlannedFile,
  type Translation,
  type TranslationFileReader,
} from './shared.js';

export interface JoinOptions {
  /** The folder of the root translation files. */
  root: string;
  /** Where the joined files belong. */
  outDir: string;
  defaultLang?: string;
  /** The default language is left out unless this is set. */
  includeDefaultLang?: boolean;
  /** The folder of each scope, when the scopes are not the folders of the root. */
  scopePathMap?: Record<string, string>;
}

/**
 * Merges the translation files of the scopes into the root file of the same
 * language, each one under the key of its scope. A scope folder nested in
 * another one is keyed with both names, `scope.nested`.
 *
 * @returns the joined file of every language, in the order of the root files
 */
export function joinTranslations(
  reader: TranslationFileReader,
  {
    root,
    outDir,
    defaultLang,
    includeDefaultLang = false,
    scopePathMap,
  }: JoinOptions,
): PlannedFile[] {
  if (includeDefaultLang && !defaultLang) {
    throw new TranslationFilesError(
      `Please specify the default language of the project using --default-lang or the defaultLang option of the Transloco config.`,
    );
  }

  const entries = getScopeEntries(reader, root, scopePathMap);

  return findTranslationFiles(reader, root)
    .map((fileName) => ({ fileName, lang: languageOf(fileName) }))
    .filter(({ lang }) => includeDefaultLang || lang !== defaultLang)
    .map(({ fileName, lang }) => {
      const rootFile = join(root, fileName);
      const translation: Translation = readJsonObject(reader, rootFile);
      const origins = new Map<string, string>();

      for (const { scope, path: scopePath } of entries) {
        // Split drops a scope's key from the root file, so the value of a key
        // that only looks like the scope of another language would be lost.
        if (
          Object.hasOwn(translation, scope) &&
          !reader.listFiles(scopePath).some((f) => isLanguageFile(f, lang))
        ) {
          throw new TranslationFilesError(
            `The key "${scope}" in ${rootFile} is also the scope ${scopePath}, which has no ${lang} file to take its place, rename one and run the command again.`,
          );
        }

        mergeScope({
          reader,
          dir: scopePath,
          translation,
          lang,
          key: scope,
          origins,
          rootFile,
        });
      }

      return {
        path: join(outDir, `${lang}.json`),
        content: toJson(translation),
      };
    });
}

interface MergeScope {
  reader: TranslationFileReader;
  dir: string;
  translation: Translation;
  lang: string;
  key: string;
  /** The file each key was taken from, to name it when another file wants the key. */
  origins: Map<string, string>;
  rootFile: string;
}

function mergeScope(params: MergeScope) {
  const { reader, dir, translation, lang, key, origins, rootFile } = params;

  for (const fileName of reader.listFiles(dir)) {
    if (!isLanguageFile(fileName, lang)) continue;

    const file = join(dir, fileName);

    if (Object.hasOwn(translation, key)) {
      throw new TranslationFilesError(
        `The key "${key}" is defined in both ${origins.get(key) ?? rootFile} and ${file}, rename one and run the command again.`,
      );
    }

    translation[key] = readJsonObject(reader, file);
    origins.set(key, file);
  }

  for (const subDir of reader.listDirs(dir)) {
    mergeScope({
      ...params,
      dir: join(dir, subDir),
      key: getTranslationKey(key, subDir),
    });
  }
}
