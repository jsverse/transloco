import { getGlobalConfig } from '../config/index.js';
import { CliError } from '../errors.js';
import {
  findTranslationFiles,
  splitTranslations,
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

const name = 'Split';

export interface SplitCommandOptions {
  translationsPath?: string;
  source: string;
  config?: string;
}

export function runSplit({
  translationsPath,
  source,
  config,
}: SplitCommandOptions) {
  assertConfigPathExists(config);

  const globalConfig = getGlobalConfig(config);
  const root = resolveTranslationsRoot(name, translationsPath, globalConfig);

  assertFolderExists(name, 'translations folder', root);
  assertFolderExists(name, 'source folder', source);

  if (!findTranslationFiles(nodeFileReader, root).length) {
    throw new CliError(
      `Transloco ${name}: No translation files (.json) found in ${root}`,
    );
  }

  const joined = findTranslationFiles(nodeFileReader, source);

  if (!joined.length) {
    throw new CliError(
      `Transloco ${name}: No translation files (.json) found in ${source}`,
    );
  }

  const files = asCliError(name, () =>
    splitTranslations(nodeFileReader, {
      root,
      source,
      scopePathMap: globalConfig.scopePathMap,
    }),
  );

  for (const file of files) {
    outputFile(file.path, file.content);
  }

  console.log(
    `Transloco ${name}: Split ${languagesOf(joined).join(', ')} from ${source} into ${root}`,
  );
}
