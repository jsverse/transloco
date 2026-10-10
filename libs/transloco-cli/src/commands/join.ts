import fs from 'node:fs';
import path from 'node:path';

import { getGlobalConfig } from '../config/index.js';
import { CliError } from '../errors.js';
import {
  findTranslationFiles,
  joinTranslations,
} from '../translation-files/index.js';
import { nodeFileReader } from '../translation-files/node-file-reader.js';
import { outputFile } from '../utils/file-system.js';

import { assertConfigPathExists } from './config-path.js';
import {
  asCliError,
  assertFolderExists,
  languagesOf,
  resolveTranslationsRoot,
} from './translation-folders.js';

const name = 'Join';

export interface JoinCommandOptions {
  translationsPath?: string;
  outDir: string;
  defaultLang?: string;
  includeDefaultLang?: boolean;
  config?: string;
}

export function runJoin({
  translationsPath,
  outDir,
  defaultLang,
  includeDefaultLang = false,
  config,
}: JoinCommandOptions) {
  assertConfigPathExists(config);

  const globalConfig = getGlobalConfig(config);
  const root = resolveTranslationsRoot(name, translationsPath, globalConfig);
  const { scopePathMap } = globalConfig;

  assertFolderExists(name, 'translations folder', root);

  if (!findTranslationFiles(nodeFileReader, root).length) {
    throw new CliError(
      `Transloco ${name}: No translation files (.json) found in ${root}`,
    );
  }

  assertOutDirIsSafe(outDir, root, scopePathMap);

  const files = asCliError(name, () =>
    joinTranslations(nodeFileReader, {
      root,
      outDir,
      defaultLang: defaultLang ?? globalConfig.defaultLang,
      includeDefaultLang,
      scopePathMap,
    }),
  );

  if (!files.length) {
    throw new CliError(
      `Transloco ${name}: Only the default language was found in ${root}, pass --include-default-lang to join it`,
    );
  }

  // Everything that can fail has by now, so what is in the folder is only
  // removed for the files that are about to take its place.
  fs.rmSync(outDir, { recursive: true, force: true });

  for (const file of files) {
    outputFile(file.path, file.content);
  }

  const langs = languagesOf(files.map((file) => file.path));

  console.log(`Transloco ${name}: Joined ${langs.join(', ')} into ${outDir}`);
}

/**
 * The folder is emptied before it is written to, so it must not be one that
 * holds anything else: the working directory, a folder above it or outside of
 * it, and the translations or the scopes the files come from, nor any folder
 * above or below them, where the joined files would be taken for a scope.
 */
function assertOutDirIsSafe(
  outDir: string,
  root: string,
  scopePathMap: Record<string, string> | undefined,
) {
  const out = path.resolve(outDir);
  const refuse = (reason: string) => {
    throw new CliError(
      `Transloco ${name}: Refusing to empty ${outDir}, ${reason}`,
    );
  };

  if (contains(out, process.cwd())) {
    refuse('it is the current directory or one of its parents');
  }

  if (!contains(process.cwd(), out)) {
    refuse('it is not inside the current directory');
  }

  if (contains(out, root) || contains(root, out)) {
    refuse(`it is, holds or lies inside the translations folder ${root}`);
  }

  for (const [scope, scopePath] of Object.entries(scopePathMap ?? {})) {
    if (contains(out, scopePath) || contains(scopePath, out)) {
      refuse(`it is, holds or lies inside the folder of the scope ${scope}`);
    }
  }

  if (fs.statSync(out, { throwIfNoEntry: false })?.isFile()) {
    refuse('it is a file');
  }
}

/** Whether `child` is `parent` or lies below it. */
function contains(parent: string, child: string) {
  const fold = (value: string) =>
    process.platform === 'linux' ? value : value.toLowerCase();
  const relative = path.relative(
    fold(path.resolve(parent)),
    fold(path.resolve(child)),
  );

  return (
    relative === '' ||
    (relative !== '..' &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative))
  );
}
