import { join } from 'node:path';

/**
 * What the join and split read of the file system. They only ever read: what
 * they would write is handed back for the caller to write wherever it keeps its
 * files (the disk, or a schematics tree).
 */
export interface TranslationFileReader {
  /** The names of the files directly in the folder. A missing folder has none. */
  listFiles(dir: string): string[];
  /** The names of the folders directly in the folder. A missing folder has none. */
  listDirs(dir: string): string[];
  readFile(file: string): string;
}

/** A file to write. */
export interface PlannedFile {
  path: string;
  content: string;
}

/** A translation file the user has to fix. It's reported as its message alone. */
export class TranslationFilesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TranslationFilesError';
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Translation = Record<string, any>;

export interface ScopeEntry {
  scope: string;
  path: string;
}

export const languageOf = (fileName: string) => fileName.split('.')[0];

export const toJson = (value: unknown) => JSON.stringify(value, null, 2);

/**
 * What to write for the file to hold the value, nothing when it already does.
 * A file that does change ends with a line break if it did before.
 */
export function planRewrite(
  reader: TranslationFileReader,
  path: string,
  value: unknown,
): PlannedFile | undefined {
  const current = reader.readFile(path);

  if (holds(current, value)) return undefined;

  const content = toJson(value);

  return { path, content: current.endsWith('\n') ? `${content}\n` : content };
}

/** Whether the parsed file is the value, key order included, whatever its formatting. */
function holds(content: string, value: unknown) {
  try {
    return (
      JSON.stringify(JSON.parse(content.replace(/^\uFEFF/, ''))) ===
      JSON.stringify(value)
    );
  } catch {
    return false;
  }
}

/** The prefix is joined to the key with a dot, which is how a scope nested in another is keyed. */
export const getTranslationKey = (prefix: string, key: string) =>
  prefix ? `${prefix}.${key}` : key;

/** The JSON files of the folder, which are the ones that are translations. */
export function findTranslationFiles(
  reader: TranslationFileReader,
  dir: string,
) {
  return reader.listFiles(dir).filter((fileName) => fileName.endsWith('.json'));
}

/**
 * The folders holding the scopes: the ones the config maps when it maps any,
 * otherwise the folders of the translations root.
 */
export function getScopeEntries(
  reader: TranslationFileReader,
  root: string,
  scopePathMap?: Record<string, string>,
): ScopeEntry[] {
  if (scopePathMap && Object.keys(scopePathMap).length) {
    return Object.entries(scopePathMap).map(([scope, scopePath]) => ({
      scope,
      path: scopePath,
    }));
  }

  return reader
    .listDirs(root)
    .map((dir) => ({ scope: dir, path: join(root, dir) }));
}

export function readJson(reader: TranslationFileReader, file: string) {
  const content = reader.readFile(file).replace(/^\uFEFF/, '');

  try {
    return JSON.parse(content);
  } catch (error) {
    // A syntax error may quote the offending part of the file, line breaks included.
    const reason = (error as Error).message.replace(/\s*\n\s*/g, ' ').trim();

    throw new TranslationFilesError(`Invalid JSON in ${file}: ${reason}`);
  }
}
