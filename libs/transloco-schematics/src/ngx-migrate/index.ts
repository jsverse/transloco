import * as nodePath from 'node:path';

import { Rule } from '@angular-devkit/schematics';
import * as ora from 'ora';
import { replaceInFile } from 'replace-in-file';

import { SchemaOptions } from './schema';
import { generateMatchers } from './migration-matchers';

export default function (options: SchemaOptions): Rule {
  return () => run(options);
}

export async function run(options: SchemaOptions) {
  console.log('\x1b[4m%s\x1b[0m', '\nStarting migration script');
  const dir = nodePath.resolve(process.cwd());

  const path = nodePath.join(dir, options.path, '/**/*');
  const { tsReplacements, htmlReplacements } = generateMatchers(path);

  async function migrate(matchersArr, filesType) {
    console.log(`\nMigrating ${filesType} files 📜`);
    let spinner;
    const isWindows = process.platform === 'win32';

    for (let i = 0; i < matchersArr.length; i++) {
      const { step, matchers } = matchersArr[i];
      const msg = `Step ${i + 1}/${matchersArr.length}: Migrating ${step}`;
      spinner = ora().start(msg);
      const noFilesFound = [];
      for (const matcher of matchers) {
        try {
          await replaceInFile({
            ...matcher,
            glob: {
              windowsPathsNoEscape: isWindows,
            },
          });
        } catch (e) {
          if (e.message.includes('No files match the pattern')) {
            noFilesFound.push(e.message);
          } else {
            throw e;
          }
        }
      }
      spinner.succeed(msg);
      noFilesFound.forEach((pattern) =>
        console.log('\x1b[33m%s\x1b[0m', `⚠️ ${pattern}`),
      );
    }
  }

  return migrate(htmlReplacements, 'HTML')
    .then(() => migrate(tsReplacements, 'TS'))
    .then(() => {
      console.log('\n              🌵 Done! 🌵');
      console.log('Welcome to a better translation experience 🌐');
      console.log(
        '\nFor more information about this script please visit 👉 https://jsverse.github.io/transloco/docs/migration/ngx\n',
      );
    });
}
