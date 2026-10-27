import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { stripVTControlCharacters } from 'node:util';

import { globSync } from 'glob';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { findFiles } from '../find-files.js';

import { migrateAngularI18n } from './migrate-angular-i18n.js';

vi.mock('../find-files.js', async (importOriginal) => ({
  findFiles: vi.fn(
    (await importOriginal<typeof import('../find-files.js')>()).findFiles,
  ),
}));

vi.mock('glob', async (importOriginal) => {
  const original = await importOriginal<typeof import('glob')>();

  return { ...original, globSync: vi.fn(original.globSync) };
});

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
 * `expected` is the project of the fixtures after the migration ran with
 * `src/app` as the input, `src/assets/i18n` as the output and the languages
 * en and es.
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
        THEN the templates and the translation files are the expected ones`, () => {
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
        THEN it prints the marks it left, with their files and lines, and the greeting`, () => {
      process.chdir(dir);

      migrateAngularI18n({
        input: 'src/app',
        output: 'src/assets/i18n',
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
        THEN no translation file is written`, () => {
      write('app/a.ts', '');

      migrateAngularI18n({
        input: path.join(dir, 'app'),
        output: path.join(dir, 'i18n'),
        langs: ['en', 'es'],
      });

      expect(fs.existsSync(path.join(dir, 'i18n'))).toBe(false);
      expect(printed()).toContain(
        '⚠️ No i18n mark was found, no translation file is written',
      );
    });

    it(`GIVEN the same key in two templates, with different texts
        WHEN the migration runs
        THEN the template that comes first in the walk supplies the text, and both are printed with their files and lines`, () => {
      write('app/a.html', '<p i18n="@@key">From a</p>');
      write('app/b.html', '\n<p i18n="@@key">From b</p>');
      process.chdir(dir);

      migrateAngularI18n({ input: 'app', output: 'i18n', langs: ['en'] });

      expect(JSON.parse(read('i18n/en.json'))).toEqual({ key: 'From a' });
      expect(printed()).toContain(
        `⚠️ ${path.join('app', 'b.html')}:2: The key 'key' has another text in ${path.join('app', 'a.html')}:1, which is kept, and "From b" is left out`,
      );
    });

    it(`GIVEN the same key in two templates, with the same text
        WHEN the migration runs
        THEN nothing is printed about it`, () => {
      write('app/a.html', '<p i18n="@@key">Same</p>');
      write('app/b.html', '<p i18n="@@key">Same</p>');
      process.chdir(dir);

      migrateAngularI18n({ input: 'app', output: 'i18n', langs: ['en'] });

      expect(JSON.parse(read('i18n/en.json'))).toEqual({ key: 'Same' });
      expect(printed().some((line) => line.startsWith('⚠️'))).toBe(false);
    });

    it.each([
      ['in path order', (files: string[]) => [...files].sort()],
      [
        'in reverse path order',
        (files: string[]) => [...files].sort().reverse(),
      ],
      ['shuffled', (files: string[]) => [files[1], files[2], files[0]]],
    ])(
      `GIVEN the same key in three templates, and a file system that lists them %s
       WHEN the migration runs
       THEN the template first in path order supplies the text`,
      (_, reorder) => {
        write('app/b.html', '<p i18n="@@key">From b</p>');
        write('app/c.html', '<p i18n="@@key">From c</p>');
        write('app/a.html', '<p i18n="@@key">From a</p>');
        const listed = vi.mocked(globSync).getMockImplementation() as (
          ...args: unknown[]
        ) => string[];

        vi.mocked(globSync).mockImplementationOnce(((...args: unknown[]) =>
          reorder(listed(...args))) as typeof globSync);
        migrateAngularI18n({
          input: path.join(dir, 'app'),
          output: path.join(dir, 'i18n'),
          langs: ['en'],
        });

        expect(JSON.parse(read('i18n/en.json'))).toEqual({ key: 'From a' });
      },
    );

    it(`GIVEN the same meaning in two templates
        WHEN the migration runs
        THEN the keys of both are below it`, () => {
      write('app/a.html', '<p i18n="menu|x@@one">One</p>');
      write('app/b.html', '<p i18n="menu|x@@two">Two</p>');

      migrateAngularI18n({
        input: path.join(dir, 'app'),
        output: path.join(dir, 'i18n'),
        langs: ['en'],
      });

      expect(JSON.parse(read('i18n/en.json'))).toEqual({
        menu: {
          one: 'One',
          'one.comment': 'x',
          two: 'Two',
          'two.comment': 'x',
        },
      });
      expect(read('app/a.html')).toBe(`<p>{{ 'menu.one' | transloco }}</p>`);
    });
  });

  describe('the translation files that exist', () => {
    it(`GIVEN translation files with keys of their own
        WHEN the migration runs
        THEN the keys found are added to them, and the values they hold are kept`, () => {
      write('app/a.html', '<p i18n="@@one">One</p><p i18n="m|@@two">Two</p>');
      write('i18n/en.json', '{"existing": "keep", "one": "Mine"}');
      write('i18n/es.json', '{"m": {"other": "Otro"}}');

      migrateAngularI18n({
        input: path.join(dir, 'app'),
        output: path.join(dir, 'i18n'),
        langs: ['en', 'es'],
      });

      expect(read('i18n/en.json')).toBe(
        '{\n  "existing": "keep",\n  "one": "Mine",\n  "m": {\n    "two": "Two"\n  }\n}\n',
      );
      expect(JSON.parse(read('i18n/es.json'))).toEqual({
        m: { other: 'Otro', two: 'Two' },
        one: 'One',
      });
    });

    it.each([
      ['not JSON', '{ broken'],
      ['not an object', '["a"]'],
    ])(
      `GIVEN a translation file that is %s
       WHEN the migration runs
       THEN it throws, and no template or translation file is written`,
      (_, content) => {
        write('app/a.html', '<p i18n>One</p>');
        write('i18n/en.json', '{"existing": "keep"}');
        write('i18n/es.json', content);

        expect(() =>
          migrateAngularI18n({
            input: path.join(dir, 'app'),
            output: path.join(dir, 'i18n'),
            langs: ['en', 'es'],
          }),
        ).toThrow(
          `${path.join(dir, 'i18n', 'es.json')} isn't a translation file, nothing is migrated`,
        );

        expect(read('app/a.html')).toBe('<p i18n>One</p>');
        expect(read('i18n/en.json')).toBe('{"existing": "keep"}');
        expect(read('i18n/es.json')).toBe(content);
      },
    );

    it(`GIVEN templates migrated already
        WHEN the migration runs again
        THEN the translation files are left as they are`, () => {
      write('app/a.html', '<p i18n>One</p>');
      const run = () =>
        migrateAngularI18n({
          input: path.join(dir, 'app'),
          output: path.join(dir, 'i18n'),
          langs: ['en'],
        });

      run();
      write('i18n/en.json', '{"one": "Translated"}');
      run();

      expect(read('i18n/en.json')).toBe('{"one": "Translated"}');
      expect(read('app/a.html')).toBe(`<p>{{ 'one' | transloco }}</p>`);
    });
  });

  describe('a mark the migration cannot convert', () => {
    it(`GIVEN a mark without a text, between templates that go well
        WHEN the migration runs
        THEN every template is migrated but that mark, which is printed with its file and line, and the translation files are written`, () => {
      write('app/a.html', '<p i18n>One</p>');
      write('app/b.html', '<p i18n>Two</p>\n<img i18n src="x.png">');
      write('app/c.html', '<p i18n>Three</p>');
      process.chdir(dir);

      migrateAngularI18n({ input: 'app', output: 'i18n', langs: ['en'] });

      expect(read('app/a.html')).toBe(`<p>{{ 'one' | transloco }}</p>`);
      expect(read('app/b.html')).toBe(
        `<p>{{ 'two' | transloco }}</p>\n<img i18n src="x.png">`,
      );
      expect(read('app/c.html')).toBe(`<p>{{ 'three' | transloco }}</p>`);
      expect(JSON.parse(read('i18n/en.json'))).toEqual({
        one: 'One',
        two: 'Two',
        three: 'Three',
      });
      expect(printed()).toContain(
        `⚠️ ${path.join('app', 'b.html')}:2: <img i18n> is left as it is: it has no text`,
      );
    });

    it(`GIVEN a template that fails to migrate, behind templates that went well
        WHEN the migration runs
        THEN it throws before any template or translation file is written`, () => {
      write('app/a.html', '<p i18n>One</p>');
      write('app/b.html', '<p i18n>Two</p>');
      vi.mocked(findFiles).mockReturnValueOnce(
        ['a.html', 'b.html', 'missing.html'].map((name) =>
          path.join(dir, 'app', name),
        ),
      );

      expect(() =>
        migrateAngularI18n({
          input: path.join(dir, 'app'),
          output: path.join(dir, 'i18n'),
          langs: ['en'],
        }),
      ).toThrow(/ENOENT/);

      expect(read('app/a.html')).toBe('<p i18n>One</p>');
      expect(read('app/b.html')).toBe('<p i18n>Two</p>');
      expect(fs.existsSync(path.join(dir, 'i18n'))).toBe(false);
    });
  });
});
