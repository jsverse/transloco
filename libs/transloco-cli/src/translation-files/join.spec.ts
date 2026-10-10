import { describe, expect, it } from 'vitest';

import { joinTranslations, type JoinOptions } from './join.js';
import { TranslationFilesError } from './shared.js';
import {
  createMemoryReader,
  json,
  type MemoryFiles,
} from './tests/memory-file-reader.js';

const root = 'src/assets/i18n';
const options: JoinOptions = { root, outDir: 'dist-i18n', defaultLang: 'en' };

const en = { hello: 'hello' };
const es = { hello: 'hola' };
const scopeEn = { hello: 'hello scope' };
const scopeEs = { hello: 'hola scope' };

const rootFiles: MemoryFiles = {
  [`${root}/es.json`]: json(es),
  [`${root}/en.json`]: json(en),
};
const scopeFiles: MemoryFiles = {
  [`${root}/scope/en.json`]: json(scopeEn),
  [`${root}/scope/es.json`]: json(scopeEs),
};

function join(files: MemoryFiles, overrides: Partial<JoinOptions> = {}) {
  return joinTranslations(createMemoryReader(files), {
    ...options,
    ...overrides,
  });
}

const contentOf = (
  planned: { path: string; content: string }[],
  lang: string,
) => planned.find(({ path }) => path === `dist-i18n/${lang}.json`)?.content;

describe('joinTranslations', () => {
  describe('default strategy', () => {
    const files = { ...rootFiles, ...scopeFiles };

    it(`GIVEN translation files in default and non-default languages
        WHEN it runs without includeDefaultLang
        THEN only the non-default language is joined`, () => {
      expect(join(files).map(({ path }) => path)).toEqual([
        'dist-i18n/es.json',
      ]);
    });

    it(`GIVEN translation files in default and non-default languages
        WHEN it runs with includeDefaultLang
        THEN every language is joined, in the order of the root files`, () => {
      const planned = join(files, { includeDefaultLang: true });

      expect(planned.map(({ path }) => path)).toEqual([
        'dist-i18n/es.json',
        'dist-i18n/en.json',
      ]);
    });

    it(`GIVEN a scope folder next to the root files
        WHEN it runs
        THEN the scope is merged into the root file under its folder name`, () => {
      expect(contentOf(join(files), 'es')).toBe(
        json({ hello: 'hola', scope: { hello: 'hola scope' } }),
      );
    });

    it(`GIVEN the root files are in a project folder
        WHEN it runs with that folder as the root
        THEN the files of that folder are joined`, () => {
      const projectRoot = 'projects/baz/src/assets/i18n';
      const planned = join(
        {
          [`${projectRoot}/en.json`]: json(scopeEn),
          [`${projectRoot}/es.json`]: json(scopeEs),
        },
        { root: projectRoot },
      );

      expect(planned).toEqual([
        { path: 'dist-i18n/es.json', content: json(scopeEs) },
      ]);
    });

    it(`GIVEN a custom output folder
        WHEN it runs
        THEN the joined files are planned inside of it`, () => {
      expect(join(files, { outDir: 'out/i18n' })[0].path).toBe(
        'out/i18n/es.json',
      );
    });

    it(`GIVEN a scope folder with no file for a language
        WHEN it runs
        THEN that language has no key for the scope`, () => {
      const planned = join(
        { ...rootFiles, [`${root}/scope/en.json`]: json(scopeEn) },
        { includeDefaultLang: true },
      );

      expect(contentOf(planned, 'es')).toBe(json(es));
      expect(contentOf(planned, 'en')).toBe(
        json({ hello: 'hello', scope: scopeEn }),
      );
    });

    it(`GIVEN a scope folder with no files
        WHEN it runs
        THEN the root file is left as it is`, () => {
      const planned = join({
        ...rootFiles,
        [`${root}/scope/notes.txt`]: 'notes',
      });

      expect(contentOf(planned, 'es')).toBe(json(es));
    });

    it(`GIVEN several scopes
        WHEN it runs
        THEN the scopes come after the root keys in the order of their folders`, () => {
      const planned = join({
        ...rootFiles,
        [`${root}/b/es.json`]: json({ b: 1 }),
        [`${root}/a/es.json`]: json({ a: 1 }),
      });

      expect(Object.keys(JSON.parse(contentOf(planned, 'es')!))).toEqual([
        'hello',
        'b',
        'a',
      ]);
    });
  });

  describe('nested scope folders', () => {
    it(`GIVEN a scope folder nested in another scope folder
        WHEN it runs
        THEN the nested scope is keyed with both folder names, next to its parent`, () => {
      const planned = join({
        ...rootFiles,
        ...scopeFiles,
        [`${root}/scope/nested/es.json`]: json({ sun: 'sol' }),
        [`${root}/scope/nested/deeper/es.json`]: json({ moon: 'luna' }),
      });

      expect(JSON.parse(contentOf(planned, 'es')!)).toEqual({
        hello: 'hola',
        scope: { hello: 'hola scope' },
        'scope.nested': { sun: 'sol' },
        'scope.nested.deeper': { moon: 'luna' },
      });
    });

    it(`GIVEN a scope folder that holds only other folders
        WHEN it runs
        THEN the folders inside of it are still joined`, () => {
      const planned = join({
        ...rootFiles,
        [`${root}/outer/inner/es.json`]: json({ sun: 'sol' }),
      });

      expect(JSON.parse(contentOf(planned, 'es')!)).toEqual({
        hello: 'hola',
        'outer.inner': { sun: 'sol' },
      });
    });
  });

  describe('scope map strategy', () => {
    const scopeMapFiles = (...paths: string[]) =>
      Object.fromEntries(
        paths.flatMap((path) => [
          [`${path}/en.json`, json(scopeEn)],
          [`${path}/es.json`, json(scopeEs)],
        ]),
      );

    it(`GIVEN a scopePathMap with a scope
        WHEN it runs
        THEN the scope is merged from the mapped folder`, () => {
      const planned = join(
        { ...rootFiles, ...scopeMapFiles('src/app/assets/i18n') },
        { scopePathMap: { scope: 'src/app/assets/i18n' } },
      );

      expect(contentOf(planned, 'es')).toBe(
        json({ hello: 'hola', scope: scopeEs }),
      );
    });

    it(`GIVEN a scopePathMap with several scopes
        WHEN it runs
        THEN every scope is merged under its own key`, () => {
      const planned = join(
        {
          ...rootFiles,
          ...scopeMapFiles(
            'src/app/assets/i18n/scope1',
            'src/app/assets/i18n/scope2',
          ),
        },
        {
          scopePathMap: {
            scopeA: 'src/app/assets/i18n/scope1',
            scopeB: 'src/app/assets/i18n/scope2',
          },
        },
      );

      expect(contentOf(planned, 'es')).toBe(
        json({ hello: 'hola', scopeA: scopeEs, scopeB: scopeEs }),
      );
    });

    it(`GIVEN a scopePathMap spanning several projects
        WHEN it runs
        THEN the scopes of all the projects are merged`, () => {
      const planned = join(
        {
          ...rootFiles,
          ...scopeMapFiles(
            'projects/bar/src/assets/i18n',
            'projects/baz/src/assets/i18n',
          ),
        },
        {
          scopePathMap: {
            libA: 'projects/bar/src/assets/i18n',
            libB: 'projects/baz/src/assets/i18n',
          },
        },
      );

      expect(contentOf(planned, 'es')).toBe(
        json({ hello: 'hola', libA: scopeEs, libB: scopeEs }),
      );
    });

    it(`GIVEN a scopePathMap and folders in the root
        WHEN it runs
        THEN the folders of the root are not taken for scopes`, () => {
      const planned = join(
        { ...rootFiles, ...scopeFiles },
        { scopePathMap: { elsewhere: 'libs/elsewhere' } },
      );

      expect(contentOf(planned, 'es')).toBe(json(es));
    });

    it(`GIVEN an empty scopePathMap
        WHEN it runs
        THEN the folders of the root are the scopes`, () => {
      const planned = join(
        { ...rootFiles, ...scopeFiles },
        { scopePathMap: {} },
      );

      expect(JSON.parse(contentOf(planned, 'es')!)).toHaveProperty('scope');
    });
  });

  describe('default language', () => {
    it(`GIVEN includeDefaultLang and no default language
        WHEN it runs
        THEN every language is joined`, () => {
      expect(
        join(rootFiles, {
          defaultLang: undefined,
          includeDefaultLang: true,
        }).map(({ path }) => path),
      ).toEqual(['dist-i18n/es.json', 'dist-i18n/en.json']);
    });

    it(`GIVEN no default language
        WHEN it runs without includeDefaultLang
        THEN every language is joined`, () => {
      expect(
        join(rootFiles, { defaultLang: undefined }).map(({ path }) => path),
      ).toEqual(['dist-i18n/es.json', 'dist-i18n/en.json']);
    });

    it(`GIVEN a root with only the default language
        WHEN it runs without includeDefaultLang
        THEN nothing is planned`, () => {
      expect(join({ [`${root}/en.json`]: json(en), ...scopeFiles })).toEqual(
        [],
      );
    });
  });

  describe('files that are not translations', () => {
    it(`GIVEN files of other types in the root
        WHEN it runs
        THEN they are neither read nor joined`, () => {
      const planned = join(
        {
          ...rootFiles,
          [`${root}/.gitkeep`]: '',
          [`${root}/README.md`]: '# not json',
          [`${root}/fr.json.bak`]: 'not json',
        },
        { includeDefaultLang: true },
      );

      expect(planned.map(({ path }) => path)).toEqual([
        'dist-i18n/es.json',
        'dist-i18n/en.json',
      ]);
    });

    it(`GIVEN no files in the root
        WHEN it runs
        THEN nothing is planned`, () => {
      expect(join({ [`${root}/scope/es.json`]: json(scopeEs) })).toEqual([]);
    });

    it(`GIVEN a scope file whose name only ends with the file name of the language
        WHEN it runs
        THEN it is taken for the file of the language`, () => {
      const planned = join({
        ...rootFiles,
        [`${root}/scope/ees.json`]: json({ taken: true }),
      });

      expect(JSON.parse(contentOf(planned, 'es')!).scope).toEqual({
        taken: true,
      });
    });
  });

  describe('output', () => {
    it(`GIVEN joined translations
        WHEN the files are planned
        THEN they hold the JSON indented by two spaces, with no trailing line break`, () => {
      const [{ content }] = join({ ...rootFiles, ...scopeFiles });

      expect(content).toBe(
        '{\n  "hello": "hola",\n  "scope": {\n    "hello": "hola scope"\n  }\n}',
      );
    });

    it(`GIVEN a root file with a byte order mark
        WHEN it runs
        THEN the file is read`, () => {
      const [{ content }] = join({
        [`${root}/es.json`]: `${String.fromCharCode(0xfeff)}${json(es)}`,
      });

      expect(content).toBe(json(es));
    });
  });

  describe('problems in the files', () => {
    it(`GIVEN a key the root file and a scope both define
        WHEN it runs
        THEN it fails naming the key and both files`, () => {
      expect(() =>
        join({
          [`${root}/es.json`]: json({ hello: 'hola', scope: { a: 1 } }),
          ...scopeFiles,
        }),
      ).toThrow(
        new TranslationFilesError(
          `The key "scope" is defined in both ${root}/es.json and ${root}/scope/es.json, rename one and run the command again.`,
        ),
      );
    });

    it(`GIVEN two files of a scope for the same language
        WHEN it runs
        THEN it fails naming the key and both files`, () => {
      expect(() =>
        join({
          ...rootFiles,
          [`${root}/scope/es.json`]: json(scopeEs),
          [`${root}/scope/ees.json`]: json(scopeEs),
        }),
      ).toThrow(
        new TranslationFilesError(
          `The key "scope" is defined in both ${root}/scope/es.json and ${root}/scope/ees.json, rename one and run the command again.`,
        ),
      );
    });

    it(`GIVEN a nested folder and a mapped scope that end up with the same key
        WHEN it runs
        THEN it fails naming the key and both files`, () => {
      expect(() =>
        join(
          {
            ...rootFiles,
            [`${root}/a/es.json`]: json({ a: 1 }),
            [`${root}/a/b/es.json`]: json({ b: 1 }),
            'libs/other/es.json': json({ c: 1 }),
          },
          { scopePathMap: { a: `${root}/a`, 'a.b': 'libs/other' } },
        ),
      ).toThrow(
        /The key "a.b" is defined in both .*a\/b\/es.json and libs\/other\/es.json/,
      );
    });

    it(`GIVEN a root file that is not valid JSON
        WHEN it runs
        THEN it fails naming the file`, () => {
      expect(() => join({ [`${root}/es.json`]: '{ "hello": ' })).toThrow(
        new RegExp(`^Invalid JSON in ${root}/es.json: `),
      );
    });

    it(`GIVEN a scope file that is empty
        WHEN it runs
        THEN it fails naming the file`, () => {
      expect(() =>
        join({ ...rootFiles, [`${root}/scope/es.json`]: '' }),
      ).toThrow(new RegExp(`^Invalid JSON in ${root}/scope/es.json: `));
    });

    it(`GIVEN a default language file that is not valid JSON
        WHEN it runs without includeDefaultLang
        THEN the file that is left out is not read`, () => {
      const planned = join({ ...rootFiles, [`${root}/en.json`]: 'nope' });

      expect(planned).toHaveLength(1);
    });
  });
});
