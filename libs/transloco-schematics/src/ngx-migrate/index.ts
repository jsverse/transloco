import * as nodePath from 'node:path';
import * as fs from 'node:fs/promises';

import * as glob from 'glob';
import { Rule } from '@angular-devkit/schematics';

import { SchemaOptions } from './schema';
import { generateMatchers, Matcher } from './migration-matchers';

export default function (options: SchemaOptions): Rule {
  return () => run(options);
}

export async function run(options: SchemaOptions) {
  console.log('\x1b[4m%s\x1b[0m', '\nStarting migration script');
  const dir = nodePath.resolve(process.cwd());

  const path = nodePath.join(dir, options.path, '/**/*');
  const { tsReplacements, htmlReplacements } = generateMatchers(path);

  async function migrate(matchersArr: Matcher[], filesType: 'HTML' | 'TS') {
    console.log(`\nMigrating ${filesType} files 📜`);
    const isWindows = process.platform === 'win32';

    for (let i = 0; i < matchersArr.length; i++) {
      const { step, matchers } = matchersArr[i];
      const msg = `Step ${i + 1}/${matchersArr.length}: Migrating ${step}`;
      console.log(`⏳ ${msg}`);

      const noFilesFound = [];
      for (const matcher of matchers) {
        try {
          // Find files matching the pattern
          const files = glob.sync(matcher.files, {
            windowsPathsNoEscape: isWindows,
            nodir: true,
          });

          if (files.length === 0) {
            noFilesFound.push(`No files match the pattern: ${matcher.files}`);
            continue;
          }

          // Process each file
          for (const file of files) {
            const content = await fs.readFile(file, 'utf8');

            // Apply all replacements
            let lastIndex = 0;
            let result: RegExpExecArray | null;
            let newContent = '';

            while ((result = matcher.from.exec(content)) !== null) {
              // Add the text from last match to current match
              newContent += content.slice(lastIndex, result.index);

              // Generate replacement text
              const replacement =
                typeof matcher.to === 'function'
                  ? matcher.to(result[0], ...result.slice(1))
                  : matcher.to;

              newContent += replacement;
              lastIndex = matcher.from.lastIndex;
            }

            // Add remaining content after last match
            newContent += content.slice(lastIndex);

            // Write the modified content back to the file
            await fs.writeFile(file, newContent, 'utf8');
          }
        } catch (e) {
          if (e.message.includes('No files match the pattern')) {
            noFilesFound.push(e.message);
          } else {
            throw e;
          }
        }
      }
      console.log(`✅ ${msg}`);
      noFilesFound.forEach((pattern) =>
        console.log('\x1b[33m%s\x1b[0m', `⚠️ ${pattern}`),
      );
    }
  }
  await migrate(htmlReplacements, 'HTML');
  await migrate(tsReplacements, 'TS');

  console.log('\n              🌵 Done! 🌵');
  console.log('Welcome to a better translation experience 🌐');
  console.log(
    '\nFor more information about this script please visit 👉 https://jsverse.github.io/transloco/docs/migration/ngx\n',
  );
}
