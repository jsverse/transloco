import fs from 'node:fs';
import path from 'node:path';

import { style } from '../../utils/style.js';
import { findFiles } from '../find-files.js';

import { applyMatcher } from './apply-matcher.js';
import { generateMatchers, type Matcher } from './migration-matchers.js';

export interface MigrateNgxTranslateOptions {
  /** The folder holding the sources to migrate. */
  input: string;
}

/** Rewrites the HTML and TS files below the folder from ngx-translate to Transloco. */
export function migrateNgxTranslate({ input }: MigrateNgxTranslateOptions) {
  console.log(style('underline', '\nStarting migration script'));

  const dir = path.resolve(input);
  const { tsReplacements, htmlReplacements } = generateMatchers();

  migrate(dir, htmlReplacements, 'HTML');
  migrate(dir, tsReplacements, 'TS');

  console.log('\n              🌵 Done! 🌵');
  console.log('Welcome to a better translation experience 🌐');
  console.log(
    '\nFor more information about this script please visit 👉 https://jsverse.gitbook.io/transloco/migration-guides/migrate-from-ngx-translate\n',
  );
}

function migrate(dir: string, steps: Matcher[], filesType: 'HTML' | 'TS') {
  console.log(`\nMigrating ${filesType} files 📜`);

  steps.forEach(({ step, matchers }, index) => {
    const msg = `Step ${index + 1}/${steps.length}: Migrating ${step}`;
    console.log(`⏳ ${msg}`);

    const noFilesFound: string[] = [];

    for (const matcher of matchers) {
      const files = findFiles(dir, matcher.files);

      if (files.length === 0) {
        noFilesFound.push(
          `No files match the pattern: ${path.join(dir, '/**/*')}${matcher.files}`,
        );

        continue;
      }

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');

        fs.writeFileSync(file, applyMatcher(content, matcher), 'utf8');
      }
    }

    console.log(`✅ ${msg}`);
    noFilesFound.forEach((pattern) =>
      console.log(style('yellow', `⚠️ ${pattern}`)),
    );
  });
}
