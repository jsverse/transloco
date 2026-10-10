import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { stripVTControlCharacters } from 'node:util';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { findFiles } from '../find-files.js';

import { migrateAngularI18n } from './migrate-angular-i18n.js';

vi.mock('../find-files.js', async (importOriginal) => ({
  findFiles: vi.fn(
    (await importOriginal<typeof import('../find-files.js')>()).findFiles,
  ),
}));

const fixtures = path.join(import.meta.dirname, 'tests/fixtures');

/** Every file below the directory, by its path relative to it. */
function readTree(dir: string) {
  return Object.fromEntries(
    fs
      .readdirSync(dir, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => {
        const file = path.join(entry.parentPath, entry.name);

        return [
          path.relative(dir, file).split(path.sep).join('/'),
          fs.readFileSync(file, 'utf8'),
        ];
      })
      .sort(([a], [b]) => a.localeCompare(b)),
  );
}

/**
 * What the migration of the schematic did to the fixtures, recorded before it
 * moved: `expected` is the project after it ran with `src/app` as the input,
 * `src/assets/i18n` as the output and the languages en and es.
 */
describe('migrateAngularI18n', () => {
  const originalCwd = process.cwd();
  let dir: string;
  let log: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    dir = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'transloco-cli-ng-migrate-')),
    );
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

  const read = (file: string) => fs.readFileSync(path.join(dir, file), 'utf-8');

  const printed = () =>
    log.mock.calls.map(([message]) => stripVTControlCharacters(message));

  describe('the fixtures', () => {
    beforeEach(() => {
      fs.cpSync(path.join(fixtures, 'input'), dir, { recursive: true });
    });

    it(`GIVEN a project of templates of every kind
        WHEN the migration runs with relative folders
        THEN the templates and the translation files are those the schematic left`, () => {
      process.chdir(dir);

      migrateAngularI18n({
        input: 'src/app',
        output: 'src/assets/i18n',
        langs: ['en', 'es'],
      });

      expect(readTree(dir)).toEqual(readTree(path.join(fixtures, 'expected')));
    });

    it(`GIVEN the same project
        WHEN the migration runs with absolute folders, from another directory
        THEN the result is the same`, () => {
      migrateAngularI18n({
        input: path.join(dir, 'src/app'),
        output: path.join(dir, 'src/assets/i18n'),
        langs: ['en', 'es'],
      });

      expect(readTree(dir)).toEqual(readTree(path.join(fixtures, 'expected')));
    });

    it(`GIVEN the same project
        WHEN the migration runs
        THEN it prints the greeting alone, as the schematic did`, () => {
      migrateAngularI18n({
        input: path.join(dir, 'src/app'),
        output: path.join(dir, 'src/assets/i18n'),
        langs: ['en', 'es'],
      });

      expect(`${printed().join('\n')}\n`).toBe(
        fs.readFileSync(path.join(fixtures, 'expected-stdout.txt'), 'utf8'),
      );
    });

    it(`GIVEN several languages
        WHEN the migration runs
        THEN every one gets a file with the same keys in order, ending with a line break`, () => {
      migrateAngularI18n({
        input: path.join(dir, 'src/app'),
        output: path.join(dir, 'i18n'),
        langs: ['en', 'es', 'fr'],
      });

      const en = read('i18n/en.json');

      expect(read('i18n/es.json')).toBe(en);
      expect(read('i18n/fr.json')).toBe(en);
      expect(en.endsWith('}\n')).toBe(true);
      expect(Object.keys(JSON.parse(en))).toEqual(
        Object.keys(JSON.parse(en)).sort(),
      );
    });
  });

  describe('the files', () => {
    it(`GIVEN an output folder that does not exist yet, below others
        WHEN the migration runs
        THEN the folders are created`, () => {
      write('app/a.html', '<p i18n>One</p>');

      migrateAngularI18n({
        input: path.join(dir, 'app'),
        output: path.join(dir, 'public/assets/i18n'),
        langs: ['en'],
      });

      expect(read('public/assets/i18n/en.json')).toBe('{\n  "one": "One"\n}\n');
      expect(read('app/a.html')).toBe(`<p>{{ 'one' | transloco }}</p>`);
    });

    it(`GIVEN files other than templates, and templates outside the input
        WHEN the migration runs
        THEN none of them is touched and no key comes from them`, () => {
      write('app/a.html', '<p i18n>One</p>');
      write('app/a.ts', '<p i18n>Two</p>');
      write('app/a.txt', '<p i18n>Three</p>');
      write('other/b.html', '<p i18n>Four</p>');

      migrateAngularI18n({
        input: path.join(dir, 'app'),
        output: path.join(dir, 'i18n'),
        langs: ['en'],
      });

      expect(read('app/a.ts')).toBe('<p i18n>Two</p>');
      expect(read('app/a.txt')).toBe('<p i18n>Three</p>');
      expect(read('other/b.html')).toBe('<p i18n>Four</p>');
      expect(JSON.parse(read('i18n/en.json'))).toEqual({ one: 'One' });
    });

    it(`GIVEN a folder with no template
        WHEN the migration runs
        THEN an empty translation file is written for each language, as before`, () => {
      write('app/a.ts', '');

      migrateAngularI18n({
        input: path.join(dir, 'app'),
        output: path.join(dir, 'i18n'),
        langs: ['en', 'es'],
      });

      expect(read('i18n/en.json')).toBe('{}\n');
      expect(read('i18n/es.json')).toBe('{}\n');
    });

    it(`GIVEN the same key in two templates, with different texts
        WHEN the migration runs
        THEN the template that comes last in the walk supplies the text`, () => {
      write('app/a.html', '<p i18n="@@key">From a</p>');
      write('app/b.html', '<p i18n="@@key">From b</p>');
      const files = (...names: string[]) =>
        names.map((name) => path.join(dir, 'app', name));

      vi.mocked(findFiles).mockReturnValueOnce(files('a.html', 'b.html'));
      migrateAngularI18n({
        input: path.join(dir, 'app'),
        output: path.join(dir, 'one'),
        langs: ['en'],
      });
      vi.mocked(findFiles).mockReturnValueOnce(files('b.html', 'a.html'));
      write('app/a.html', '<p i18n="@@key">From a</p>');
      write('app/b.html', '<p i18n="@@key">From b</p>');
      migrateAngularI18n({
        input: path.join(dir, 'app'),
        output: path.join(dir, 'other'),
        langs: ['en'],
      });

      expect(JSON.parse(read('one/en.json'))).toEqual({ key: 'From b' });
      expect(JSON.parse(read('other/en.json'))).toEqual({ key: 'From a' });
    });

    it(`GIVEN the same meaning in two templates
        WHEN the migration runs
        THEN the keys of the later one replace the ones of the earlier, as before`, () => {
      write('app/a.html', '<p i18n="menu|x@@one">One</p>');
      write('app/b.html', '<p i18n="menu|x@@two">Two</p>');

      vi.mocked(findFiles).mockReturnValueOnce(
        ['a.html', 'b.html'].map((name) => path.join(dir, 'app', name)),
      );
      migrateAngularI18n({
        input: path.join(dir, 'app'),
        output: path.join(dir, 'i18n'),
        langs: ['en'],
      });

      expect(JSON.parse(read('i18n/en.json'))).toEqual({
        menu: { two: 'Two', 'two.comment': 'x' },
      });
    });
  });

  describe('a template the migration cannot make a key of', () => {
    it(`GIVEN a mark without a text, behind templates that went well
        WHEN the migration runs
        THEN it throws, the templates before it are rewritten and no translation file is written`, () => {
      write('app/a.html', '<p i18n>One</p>');
      write('app/b.html', '<img title="Logo" i18n-title>');
      write('app/c.html', '<p i18n>Three</p>');
      vi.mocked(findFiles).mockReturnValueOnce(
        ['a.html', 'b.html', 'c.html'].map((name) =>
          path.join(dir, 'app', name),
        ),
      );

      expect(() =>
        migrateAngularI18n({
          input: path.join(dir, 'app'),
          output: path.join(dir, 'i18n'),
          langs: ['en'],
        }),
      ).toThrow(
        new TypeError(
          "Cannot read properties of undefined (reading 'replace')",
        ),
      );

      expect(read('app/a.html')).toBe(`<p>{{ 'one' | transloco }}</p>`);
      expect(read('app/b.html')).toBe('<img title="Logo" i18n-title>');
      expect(read('app/c.html')).toBe('<p i18n>Three</p>');
      expect(fs.existsSync(path.join(dir, 'i18n'))).toBe(false);
    });
  });
});
