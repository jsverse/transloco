import path from 'node:path';

import { CliError } from '../errors.js';
import { findFiles } from '../migrate/find-files.js';
import { migrateNgxTranslate } from '../migrate/ngx-translate/migrate-ngx-translate.js';

import { assertFolderExists } from './translation-folders.js';

const name = 'Migrate';

export interface MigrateNgxTranslateCommandOptions {
  input: string;
}

export function runMigrateNgxTranslate({
  input,
}: MigrateNgxTranslateCommandOptions) {
  assertFolderExists(name, 'input folder', input);

  const dir = path.resolve(input);

  if (!findFiles(dir, '.html').length && !findFiles(dir, '.ts').length) {
    throw new CliError(
      `Transloco ${name}: No .html or .ts files found in ${input}`,
    );
  }

  migrateNgxTranslate({ input });
}
