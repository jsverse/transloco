import path from 'node:path';

import { getGlobalConfig } from '../config/index.js';
import { CliError } from '../errors.js';
import { migrateAngularI18n } from '../migrate/angular-i18n/migrate-angular-i18n.js';
import { findFiles } from '../migrate/find-files.js';

import { assertConfigPathExists } from './config-path.js';
import { assertFolderExists } from './translation-folders.js';

const name = 'Migrate';
const defaultTranslationsPath = 'src/assets/i18n';

export interface MigrateAngularI18nCommandOptions {
  input: string;
  translationsPath?: string;
  langs: string[];
  config?: string;
}

export function runMigrateAngularI18n({
  input,
  translationsPath,
  langs,
  config,
}: MigrateAngularI18nCommandOptions) {
  assertConfigPathExists(config);
  assertFolderExists(name, 'input folder', input);

  // The option and the config are two ways to the same folder, the config is
  // only read when the option doesn't give it.
  const output =
    translationsPath ??
    getGlobalConfig(config).rootTranslationsPath ??
    defaultTranslationsPath;

  // A language is the name of the file written for it, the several languages
  // are separate arguments. A comma is how the schematic took them, and would
  // write one file named after all of them.
  const joined = langs.find((lang) => lang.includes(','));

  if (joined !== undefined) {
    throw new CliError(
      `Transloco ${name}: The languages are separate arguments, not a comma separated list: '${joined}'. Run with --langs ${joined.split(',').join(' ')}`,
    );
  }

  if (!findFiles(path.resolve(input), '.html').length) {
    throw new CliError(`Transloco ${name}: No .html files found in ${input}`);
  }

  migrateAngularI18n({ input, output, langs });
}
