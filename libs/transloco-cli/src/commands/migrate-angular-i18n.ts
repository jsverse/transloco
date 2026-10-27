import fs from 'node:fs';
import path from 'node:path';

import { getGlobalConfig } from '../config/index.js';
import { CliError } from '../errors.js';
import { findFiles } from '../migrate/find-files.js';
import { assertPeers } from '../peers.js';

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

export async function runMigrateAngularI18n({
  input,
  translationsPath,
  langs,
  config,
}: MigrateAngularI18nCommandOptions) {
  assertConfigPathExists(config);
  assertFolderExists(name, 'input folder', input);

  // The files are written to, so the option must not lead out of the project.
  // The folder of the config is the project's own choice.
  if (translationsPath !== undefined && !isInsideCwd(translationsPath)) {
    throw new CliError(
      `Transloco ${name}: The translations path is not inside the current directory: ${translationsPath}`,
    );
  }

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

  // The templates are read with the parser of the Angular compiler.
  assertPeers(`migrate angular-i18n`, ['@angular/compiler']);

  const { migrateAngularI18n } =
    await import('../migrate/angular-i18n/migrate-angular-i18n.js');

  migrateAngularI18n({ input, output, langs });
}

/** Whether the path, through the links of the part of it that exists, lies inside the working directory. */
function isInsideCwd(target: string) {
  let existing = path.resolve(target);
  const rest: string[] = [];

  while (!fs.existsSync(existing) && path.dirname(existing) !== existing) {
    rest.unshift(path.basename(existing));
    existing = path.dirname(existing);
  }

  const real = path.join(fs.realpathSync(existing), ...rest);
  const relative = path.relative(fs.realpathSync(process.cwd()), real);

  return (
    relative !== '..' &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}
