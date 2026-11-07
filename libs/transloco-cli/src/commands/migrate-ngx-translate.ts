import path from 'node:path';

import { CliError } from '../errors';
import { findFiles } from '../migrate/find-files';
import { migrateNgxTranslate } from '../migrate/ngx-translate/migrate-ngx-translate';

import { assertFolderExists } from './translation-folders';

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
