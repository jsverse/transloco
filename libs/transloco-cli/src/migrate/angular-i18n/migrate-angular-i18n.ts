import fs from 'node:fs';
import path from 'node:path';

import { makeDir, outputFile, writeJsonFile } from '../../utils/file-system.js';
import { findFiles } from '../find-files.js';

import { migrateTemplate, type Translation } from './template.js';

export interface MigrateAngularI18nOptions {
  /** The folder holding the templates to migrate. */
  input: string;
  /** The folder the translation files are written to. */
  output: string;
  /** The languages to write a translation file for. */
  langs: string[];
}

/**
 * Rewrites the HTML templates below the input folder from the Angular i18n
 * marks to the `transloco` pipe, and writes the texts they held to a
 * translation file per language.
 */
export function migrateAngularI18n({
  input,
  output,
  langs,
}: MigrateAngularI18nOptions) {
  const files = findFiles(path.resolve(input), '.html');
  let translation: Translation = {};

  for (const filePath of files) {
    const tpl = fs.readFileSync(filePath, { encoding: 'utf-8' });
    const migrated = migrateTemplate(tpl);

    translation = { ...translation, ...migrated.translation };
    outputFile(filePath, migrated.template);
  }

  const sorted = Object.keys(translation)
    .sort()
    .reduce((acc: Translation, key) => {
      acc[key] = translation[key];

      return acc;
    }, {});

  for (const lang of langs) {
    const file = path.resolve(output, `${lang}.json`);

    makeDir(path.dirname(file));
    writeJsonFile(file, sorted, 2);
  }

  console.log('\n              🌵 Done! 🌵');
  console.log('Welcome to a better translation experience 🌐');
  console.log(
    '\nFor more information about this script please visit 👉 https://jsverse.gitbook.io/transloco/migration-guides/migrate-from-angulars-i18n\n',
  );
}
