import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CliError } from '../errors.js';

import {
  runMigrateAngularI18n,
  type MigrateAngularI18nCommandOptions,
} from './migrate-angular-i18n.js';

describe('runMigrateAngularI18n', () => {
  const originalCwd = process.cwd();
  let dir: string;
  let log: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // The real path, as that's what `process.cwd()` reports once inside it.
    dir = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'transloco-cli-migrate-ng-')),
    );
    process.chdir(dir);
    log = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    process.chdir(originalCwd);
    vi.restoreAllMocks();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  function write(file: string, content: string) {
    const filePath = path.join(dir, file);

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
  }

  function writeConfig(config: object, file = 'transloco.config.js') {
    write(file, `module.exports = ${JSON.stringify(config)};`);
  }

  const read = (file: string) => fs.readFileSync(path.join(dir, file), 'utf-8');
  const exists = (file: string) => fs.existsSync(path.join(dir, file));

  const options = (
    overrides: Partial<MigrateAngularI18nCommandOptions> = {},
  ): MigrateAngularI18nCommandOptions => ({
    input: 'src/app',
    langs: ['en'],
    ...overrides,
  });

  function writeTemplate(file = 'src/app/a.html') {
    write(file, '<p i18n>One</p>');
  }

  describe('the translations folder', () => {
    it(`GIVEN no translations path and no config
        WHEN the command runs
        THEN the files go to src/assets/i18n`, () => {
      writeTemplate();

      runMigrateAngularI18n(options({ langs: ['en', 'es'] }));

      expect(read('src/app/a.html')).toBe(`<p>{{ 'one' | transloco }}</p>`);
      expect(read('src/assets/i18n/en.json')).toBe('{\n  "one": "One"\n}\n');
      expect(read('src/assets/i18n/es.json')).toBe('{\n  "one": "One"\n}\n');
    });

    it(`GIVEN a config with a root translations path
        WHEN the command runs without a translations path
        THEN the files go to the root of the config`, () => {
      writeTemplate();
      writeConfig({ rootTranslationsPath: 'public/i18n' });

      runMigrateAngularI18n(options());

      expect(read('public/i18n/en.json')).toBe('{\n  "one": "One"\n}\n');
      expect(exists('src/assets/i18n/en.json')).toBe(false);
    });

    it(`GIVEN a config with a root translations path and the option
        WHEN the command runs
        THEN the option wins`, () => {
      writeTemplate();
      writeConfig({ rootTranslationsPath: 'public/i18n' });

      runMigrateAngularI18n(options({ translationsPath: 'other/i18n' }));

      expect(exists('other/i18n/en.json')).toBe(true);
      expect(exists('public/i18n/en.json')).toBe(false);
    });

    it(`GIVEN a config without a root translations path
        WHEN the command runs
        THEN the files go to src/assets/i18n`, () => {
      writeTemplate();
      writeConfig({ defaultLang: 'en' });

      runMigrateAngularI18n(options());

      expect(exists('src/assets/i18n/en.json')).toBe(true);
    });

    it(`GIVEN a config given by its path
        WHEN the command runs
        THEN its root translations path is used`, () => {
      writeTemplate();
      writeConfig({ rootTranslationsPath: 'from/custom' }, 'configs/custom.js');

      runMigrateAngularI18n(options({ config: 'configs/custom.js' }));

      expect(exists('from/custom/en.json')).toBe(true);
    });

    it(`GIVEN a config path that points at nothing
        WHEN the command runs
        THEN it fails before anything is written`, () => {
      writeTemplate();

      expect(() =>
        runMigrateAngularI18n(options({ config: 'missing.config.js' })),
      ).toThrow(
        new CliError(
          'error: the --config path does not exist: missing.config.js',
        ),
      );
      expect(read('src/app/a.html')).toBe('<p i18n>One</p>');
    });

    it(`GIVEN a translations path and a config that cannot be loaded
        WHEN the command runs
        THEN the config is not read`, () => {
      writeTemplate();
      write('transloco.config.js', 'throw new Error("broken");');

      runMigrateAngularI18n(options({ translationsPath: 'i18n' }));

      expect(exists('i18n/en.json')).toBe(true);
    });
  });

  describe('what it refuses', () => {
    it(`GIVEN an input that does not exist
        WHEN the command runs
        THEN it fails naming the folder, and writes and prints nothing`, () => {
      expect(() => runMigrateAngularI18n(options())).toThrow(
        new CliError(
          'Transloco Migrate: The input folder does not exist: src/app',
        ),
      );
      expect(exists('src/assets')).toBe(false);
      expect(log).not.toHaveBeenCalled();
    });

    it(`GIVEN an input that is a file
        WHEN the command runs
        THEN it fails saying it is no folder`, () => {
      write('src/app', '');

      expect(() => runMigrateAngularI18n(options())).toThrow(
        new CliError(
          'Transloco Migrate: The input folder is not a folder: src/app',
        ),
      );
    });

    it(`GIVEN a folder without a template
        WHEN the command runs
        THEN it fails saying it looked for .html files, and writes and prints nothing`, () => {
      write('src/app/a.ts', '<p i18n>One</p>');

      expect(() => runMigrateAngularI18n(options())).toThrow(
        new CliError('Transloco Migrate: No .html files found in src/app'),
      );
      expect(exists('src/assets')).toBe(false);
      expect(log).not.toHaveBeenCalled();
    });

    it(`GIVEN a language that holds a comma
        WHEN the command runs
        THEN it fails pointing at the separate arguments, before anything is written`, () => {
      writeTemplate();

      expect(() =>
        runMigrateAngularI18n(options({ langs: ['en,es'] })),
      ).toThrow(
        new CliError(
          `Transloco Migrate: The languages are separate arguments, not a comma separated list: 'en,es'. Run with --langs en es`,
        ),
      );
      expect(read('src/app/a.html')).toBe('<p i18n>One</p>');
      expect(exists('src/assets')).toBe(false);
    });
  });
});
