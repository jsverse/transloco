import fs from 'node:fs';
import path from 'node:path';

import { CliError } from '../../errors.js';
import {
  makeDir,
  outputFile,
  readJsonFile,
  writeJsonFile,
} from '../../utils/file-system.js';
import { style } from '../../utils/style.js';
import { findFiles } from '../find-files.js';

import {
  addMessage,
  migrateTemplate,
  pathOf,
  type Message,
  type TemplateWarning,
  type Translation,
} from './template.js';

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
 * marks to the `transloco` pipe, and adds the texts they held to a
 * translation file per language.
 *
 * A key the translation file holds already keeps its value, and a key found
 * twice with different texts keeps the first one, in path order.
 */
export function migrateAngularI18n({
  input,
  output,
  langs,
}: MigrateAngularI18nOptions) {
  const files = findFiles(path.resolve(input), '.html');
  const translation: Translation = {};
  const found = new Map<string, Message & { filePath: string }>();
  const relative = (filePath: string) => path.relative(process.cwd(), filePath);

  // Every template is migrated, and every translation file read, before the
  // first is written, so nothing is left half done when one of them fails.
  const migrated = files.map((filePath) => {
    const duplicates: TemplateWarning[] = [];
    const result = migrateTemplate(
      fs.readFileSync(filePath, { encoding: 'utf-8' }),
      (message) => {
        const key = pathOf(message);
        const first = found.get(key);

        if (!first) {
          found.set(key, { ...message, filePath });
          addMessage(translation, message);
        } else if (first.text !== message.text) {
          duplicates.push({
            line: message.line,
            message: `The key '${key}' has another text in ${relative(first.filePath)}:${first.line}, which is kept, and ${JSON.stringify(message.text)} is left out`,
          });
        }
      },
    );

    return {
      filePath,
      template: result.template,
      warnings: [...result.warnings, ...duplicates].sort(
        (a, b) => a.line - b.line,
      ),
    };
  });

  const translationFiles = langs.map((lang) => {
    const file = path.resolve(output, `${lang}.json`);

    return { file, existing: readTranslationFile(file) };
  });

  for (const { filePath, template, warnings } of migrated) {
    outputFile(filePath, template);

    for (const { line, message } of warnings) {
      console.log(
        style('yellow', `⚠️ ${relative(filePath)}:${line}: ${message}`),
      );
    }
  }

  if (!Object.keys(translation).length) {
    console.log(
      style(
        'yellow',
        '⚠️ No i18n mark was found, no translation file is written',
      ),
    );
  }

  const sorted = sortKeys(translation);

  for (const { file, existing } of Object.keys(sorted).length
    ? translationFiles
    : []) {
    const merged = existing ? addMissing(existing, sorted) : sorted;

    if (existing && JSON.stringify(merged) === JSON.stringify(existing)) {
      continue;
    }

    makeDir(path.dirname(file));
    writeJsonFile(file, merged, 2);
  }

  console.log('\n              🌵 Done! 🌵');
  console.log('Welcome to a better translation experience 🌐');
  console.log(
    '\nFor more information about this script please visit 👉 https://jsverse.github.io/transloco/docs/migration/angular\n',
  );
}

/** The translation the file holds, `undefined` when there is no file. */
function readTranslationFile(file: string) {
  if (!fs.existsSync(file)) return undefined;

  let content: unknown;

  try {
    content = readJsonFile(file);
  } catch (error) {
    throw new CliError(
      `Transloco Migrate: ${file} isn't a translation file, nothing is migrated: ${(error as Error).message}`,
    );
  }

  if (!isTranslation(content)) {
    throw new CliError(
      `Transloco Migrate: ${file} isn't a translation file, nothing is migrated: it holds no JSON object`,
    );
  }

  return content;
}

function isTranslation(value: unknown): value is Translation {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The top keys sorted, the keys below a meaning in the order they were found. */
function sortKeys(translation: Translation) {
  return Object.fromEntries(
    Object.keys(translation)
      .sort()
      .map((key) => [key, translation[key]]),
  );
}

/** The existing translation, with the keys of the other it lacks added after its own. */
function addMissing(existing: Translation, added: Translation): Translation {
  const result: Translation = { ...existing };

  for (const [key, value] of Object.entries(added)) {
    if (!(key in result)) {
      result[key] = value;
    } else if (isTranslation(result[key]) && isTranslation(value)) {
      result[key] = addMissing(result[key], value);
    }
  }

  return result;
}
