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
import { contains, locate, lstat } from '../utils/real-path.js';

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
  fs.rmSync(path.resolve(outDir), { recursive: true, force: true });

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
 *
 * A link can lead anywhere, so all of this is judged on real paths, and the
 * folder itself must not be a link, as emptying it would replace the link.
 */
function assertOutDirIsSafe(
  outDir: string,
  root: string,
  scopePathMap: Record<string, string> | undefined,
) {
  const refuse = (reason: string) => {
    throw new CliError(
      `Transloco ${name}: Refusing to empty ${outDir}, ${reason}`,
    );
  };

  if (lstat(path.resolve(outDir))?.isSymbolicLink()) {
    refuse('it is a symbolic link');
  }

  const out = locate(outDir);
  const cwd = fs.realpathSync(process.cwd());
  const realRoot = locate(root).real;

  if (out.unresolvable) {
    refuse('its real location cannot be resolved');
  }

  if (contains(out.real, cwd)) {
    refuse('it is the current directory or one of its parents');
  }

  if (!contains(cwd, out.real)) {
    refuse('it is not inside the current directory');
  }

  if (contains(out.real, realRoot) || contains(realRoot, out.real)) {
    refuse(`it is, holds or lies inside the translations folder ${root}`);
  }

  for (const [scope, scopePath] of Object.entries(scopePathMap ?? {})) {
    const realScope = locate(scopePath).real;

    if (contains(out.real, realScope) || contains(realScope, out.real)) {
      refuse(`it is, holds or lies inside the folder of the scope ${scope}`);
    }
  }

  if (!fs.statSync(out.existing).isDirectory()) {
    refuse(
      out.existing === out.real ? 'it is a file' : 'it lies inside a file',
    );
  }
}
