import { describe, expect, it } from 'vitest';

import { splitTranslations, type SplitOptions } from './split.js';
import {
  applyPlannedFiles,
  createMemoryReader,
  json,
  type MemoryFiles,
} from './tests/memory-file-reader.js';

const root = 'src/assets/i18n';
const options: SplitOptions = { root, source: 'dist-i18n' };

function split(files: MemoryFiles, overrides: Partial<SplitOptions> = {}) {
  return splitTranslations(createMemoryReader(files), {
    ...options,
    ...overrides,
  });
}

/** What the files hold once the plan is written. */
const afterSplit = (
  files: MemoryFiles,
  overrides: Partial<SplitOptions> = {},
) => applyPlannedFiles(files, split(files, overrides));

const merged = (en: unknown, es: unknown): MemoryFiles => ({
  'dist-i18n/es.json': json(es),
  'dist-i18n/en.json': json(en),
});

describe('splitTranslations', () => {
  describe('default strategy', () => {
    it(`GIVEN merged translation files and empty root files
        WHEN it runs
        THEN the root files take the content of the merged files`, () => {
      const files = {
        ...merged({ hello: 'hello translated' }, { hello: 'hola translated' }),
        [`${root}/en.json`]: '',
        [`${root}/es.json`]: '',
      };

      const result = afterSplit(files);

      expect(JSON.parse(result[`${root}/es.json`])).toEqual({
        hello: 'hola translated',
      });
      expect(JSON.parse(result[`${root}/en.json`])).toEqual({
        hello: 'hello translated',
      });
    });

    it(`GIVEN merged translation files with nested scopes
        WHEN it runs
        THEN every scope folder gets its part, nested folders included`, () => {
      const translatedEn = {
        scope: {
          hello: 'hello translated',
          subscope: { sun: 'sun translated' },
        },
      };
      const translatedEs = {
        scope: {
          hello: 'hola translated',
          subscope: { sun: 'sol translated' },
        },
      };
      const files = {
        ...merged(translatedEn, translatedEs),
        [`${root}/scope/en.json`]: '',
        [`${root}/scope/es.json`]: '',
        [`${root}/scope/subscope/en.json`]: '',
        [`${root}/scope/subscope/es.json`]: '',
      };

      const result = afterSplit(files);

      expect(JSON.parse(result[`${root}/scope/subscope/es.json`])).toEqual({
        sun: 'sol translated',
      });
      expect(JSON.parse(result[`${root}/scope/subscope/en.json`])).toEqual({
        sun: 'sun translated',
      });
      expect(JSON.parse(result[`${root}/scope/es.json`])).toEqual({
        hello: 'hola translated',
      });
      expect(JSON.parse(result[`${root}/scope/en.json`])).toEqual({
        hello: 'hello translated',
      });
    });

    it(`GIVEN keys of the merged file that belong to no scope
        WHEN it runs
        THEN they are written to the root file with the other keys left`, () => {
      const files = {
        ...merged(
          { hi: 'hi', scope: { a: 1 } },
          { hi: 'hola', scope: { a: 2 } },
        ),
        [`${root}/en.json`]: '',
        [`${root}/es.json`]: '',
        [`${root}/scope/en.json`]: '',
        [`${root}/scope/es.json`]: '',
      };

      const result = afterSplit(files);

      expect(result[`${root}/es.json`]).toBe(json({ hi: 'hola' }));
      expect(result[`${root}/scope/es.json`]).toBe(json({ a: 2 }));
    });

    it(`GIVEN a root file next to the scope folders
        WHEN the files are planned
        THEN the scopes are written before the root file`, () => {
      const files = {
        ...merged({}, { scope: { a: 1 } }),
        [`${root}/es.json`]: '',
        [`${root}/scope/es.json`]: '',
      };

      expect(split(files).map(({ path }) => path)).toEqual([
        `${root}/scope/es.json`,
        `${root}/es.json`,
      ]);
    });

    it(`GIVEN split translations
        WHEN the files are planned
        THEN they hold the JSON indented by two spaces, with no trailing line break`, () => {
      const files = {
        ...merged({}, { hi: 'hola' }),
        [`${root}/es.json`]: '',
      };

      expect(split(files)).toEqual([
        { path: `${root}/es.json`, content: '{\n  "hi": "hola"\n}' },
      ]);
    });
  });

  describe('scope map strategy', () => {
    it(`GIVEN a scopePathMap and merged translations
        WHEN it runs
        THEN the scope goes to the mapped folder`, () => {
      const scope = `${root}/scope`;
      const files = {
        ...merged(
          { scope: { hello: 'hello translated' } },
          {
            scope: { hello: 'hola translated' },
          },
        ),
        [`${scope}/en.json`]: json({ hello: 'hello scope' }),
        [`${scope}/es.json`]: json({ hello: 'hola scope' }),
      };

      const result = afterSplit(files, { scopePathMap: { scope } });

      expect(JSON.parse(result[`${scope}/es.json`])).toEqual({
        hello: 'hola translated',
      });
      expect(JSON.parse(result[`${scope}/en.json`])).toEqual({
        hello: 'hello translated',
      });
    });

    it(`GIVEN a scopePathMap that maps a folder outside the root
        WHEN it runs
        THEN the folders of the root are not taken for scopes`, () => {
      const files = {
        ...merged({}, { scope: { a: 1 }, other: { b: 2 } }),
        [`${root}/es.json`]: '',
        [`${root}/scope/es.json`]: '',
        'libs/other/es.json': '',
      };

      const result = afterSplit(files, {
        scopePathMap: { other: 'libs/other' },
      });

      expect(result['libs/other/es.json']).toBe(json({ b: 2 }));
      expect(result[`${root}/scope/es.json`]).toBe('');
      expect(result[`${root}/es.json`]).toBe(json({ scope: { a: 1 } }));
    });
  });

  describe('files that exist', () => {
    it(`GIVEN a scope folder with no file for a language
        WHEN it runs
        THEN the scope of that language is dropped, and no file is created`, () => {
      const files = {
        ...merged({ scope: { a: 1 } }, { scope: { a: 2 } }),
        [`${root}/en.json`]: '',
        [`${root}/es.json`]: '',
        [`${root}/scope/en.json`]: '',
      };

      const result = afterSplit(files);

      expect(result[`${root}/scope/en.json`]).toBe(json({ a: 1 }));
      expect(result).not.toHaveProperty([`${root}/scope/es.json`]);
      expect(result[`${root}/es.json`]).toBe(json({}));
    });

    it(`GIVEN a scope folder with no files
        WHEN it runs
        THEN the scope stays in the root file`, () => {
      const files = {
        ...merged({}, { scope: { a: 2 } }),
        [`${root}/es.json`]: '',
        [`${root}/scope/nested/es.json`]: '',
      };

      const result = afterSplit(files);

      expect(result[`${root}/es.json`]).toBe(json({ scope: { a: 2 } }));
      expect(result[`${root}/scope/nested/es.json`]).toBe('');
    });

    it(`GIVEN a language with no root file
        WHEN it runs
        THEN the scope files are written and no root file is created`, () => {
      const files = {
        ...merged({ scope: { a: 1 } }, { scope: { a: 2 } }),
        [`${root}/es.json`]: '',
        [`${root}/scope/en.json`]: '',
        [`${root}/scope/es.json`]: '',
      };

      const result = afterSplit(files);

      expect(result[`${root}/scope/en.json`]).toBe(json({ a: 1 }));
      expect(result).not.toHaveProperty([`${root}/en.json`]);
    });

    it(`GIVEN a root file of a language that was not joined
        WHEN it runs
        THEN the file is left as it is`, () => {
      const files = {
        ...merged({}, { hi: 'hola' }),
        [`${root}/es.json`]: '',
        [`${root}/fr.json`]: json({ hi: 'salut' }),
      };

      const planned = split(files);

      expect(planned.map(({ path }) => path)).toEqual([`${root}/es.json`]);
      expect(JSON.stringify(planned)).not.toContain('undefined');
    });
  });

  describe('nested scope folders', () => {
    it(`GIVEN a nested folder keyed beside its scope, the way join writes it
        WHEN it runs
        THEN the folder gets that key and the scope keeps only its own`, () => {
      const files = {
        ...merged({}, { shop: { a: 1 }, 'shop.cart': { b: 2 } }),
        [`${root}/es.json`]: '',
        [`${root}/shop/es.json`]: '',
        [`${root}/shop/cart/es.json`]: '',
      };

      const result = afterSplit(files);

      expect(result[`${root}/shop/cart/es.json`]).toBe(json({ b: 2 }));
      expect(result[`${root}/shop/es.json`]).toBe(json({ a: 1 }));
      expect(result[`${root}/es.json`]).toBe(json({}));
    });

    it(`GIVEN folders nested three levels deep and keyed beside each other
        WHEN it runs
        THEN every folder gets the key made of the names down to it`, () => {
      const files = {
        ...merged(
          {},
          {
            a: { x: 1 },
            'a.b': { y: 2 },
            'a.b.c': { z: 3 },
          },
        ),
        [`${root}/es.json`]: '',
        [`${root}/a/es.json`]: '',
        [`${root}/a/b/es.json`]: '',
        [`${root}/a/b/c/es.json`]: '',
      };

      const result = afterSplit(files);

      expect(result[`${root}/a/es.json`]).toBe(json({ x: 1 }));
      expect(result[`${root}/a/b/es.json`]).toBe(json({ y: 2 }));
      expect(result[`${root}/a/b/c/es.json`]).toBe(json({ z: 3 }));
      expect(result[`${root}/es.json`]).toBe(json({}));
    });

    it(`GIVEN a nested folder inside a scope folder that holds no files
        WHEN it runs
        THEN the nested folder gets its key and the scope has none to take`, () => {
      const files = {
        ...merged({}, { 'shop.cart': { b: 2 } }),
        [`${root}/es.json`]: '',
        [`${root}/shop/cart/es.json`]: '',
      };

      const result = afterSplit(files);

      expect(result[`${root}/shop/cart/es.json`]).toBe(json({ b: 2 }));
      expect(result[`${root}/es.json`]).toBe(json({}));
    });

    it(`GIVEN a scope key with the name of its nested folder next to the key of that folder
        WHEN it runs
        THEN the key stays in the scope and the folder gets its own key`, () => {
      const files = {
        ...merged({}, { shop: { cart: 'Carrito' }, 'shop.cart': { b: 2 } }),
        [`${root}/shop/es.json`]: '',
        [`${root}/shop/cart/es.json`]: '',
      };

      const result = afterSplit(files);

      expect(result[`${root}/shop/es.json`]).toBe(json({ cart: 'Carrito' }));
      expect(result[`${root}/shop/cart/es.json`]).toBe(json({ b: 2 }));
    });

    it(`GIVEN a scopePathMap and a folder nested in a mapped one
        WHEN it runs
        THEN the nested folder gets the key made of the scope and its name`, () => {
      const files = {
        ...merged({}, { ui: { a: 1 }, 'ui.forms': { b: 2 } }),
        [`${root}/es.json`]: '',
        'libs/ui/es.json': '',
        'libs/ui/forms/es.json': '',
      };

      const result = afterSplit(files, { scopePathMap: { ui: 'libs/ui' } });

      expect(result['libs/ui/es.json']).toBe(json({ a: 1 }));
      expect(result['libs/ui/forms/es.json']).toBe(json({ b: 2 }));
    });

    // The shape split took before join keyed a nested folder beside its scope,
    // which the schematics are still held to.
    it(`GIVEN a nested folder given inside its scope, with no key of its own
        WHEN it runs
        THEN the value is written to the files of that folder`, () => {
      const files = {
        ...merged({}, { shop: { cart: 'Carrito' } }),
        [`${root}/shop/es.json`]: '',
        [`${root}/shop/cart/es.json`]: '',
      };

      const result = afterSplit(files);

      expect(result[`${root}/shop/cart/es.json`]).toBe(json('Carrito'));
      expect(result[`${root}/shop/es.json`]).toBe(json({}));
    });

    it(`GIVEN a scope key named like a nested folder that has no file for the language
        WHEN it runs
        THEN the key stays in the scope file`, () => {
      const files = {
        ...merged({}, { shop: { cart: 'Carrito' } }),
        [`${root}/shop/es.json`]: '',
        [`${root}/shop/cart/en.json`]: '',
      };

      const result = afterSplit(files);

      expect(result[`${root}/shop/es.json`]).toBe(json({ cart: 'Carrito' }));
      expect(result[`${root}/shop/cart/en.json`]).toBe('');
    });

    it(`GIVEN a folder named like a property every object has
        WHEN it runs
        THEN nothing is taken from the prototype`, () => {
      const files = {
        ...merged({}, { shop: { a: 1 } }),
        [`${root}/shop/es.json`]: '',
        [`${root}/shop/constructor/es.json`]: '',
        [`${root}/shop/__proto__/es.json`]: '',
      };

      const result = afterSplit(files);

      expect(result[`${root}/shop/es.json`]).toBe(json({ a: 1 }));
      expect(result[`${root}/shop/constructor/es.json`]).toBe('');
      expect(result[`${root}/shop/__proto__/es.json`]).toBe('');
    });
  });

  describe('files that are not translations', () => {
    it(`GIVEN files of other types in the root and in the source
        WHEN it runs
        THEN they are neither read nor written`, () => {
      const files = {
        ...merged({}, { hi: 'hola' }),
        'dist-i18n/.gitkeep': '',
        'dist-i18n/notes.txt': 'not json',
        [`${root}/es.json`]: '',
        [`${root}/.gitkeep`]: '',
        [`${root}/README.md`]: '# not json',
      };

      expect(split(files).map(({ path }) => path)).toEqual([`${root}/es.json`]);
    });

    it(`GIVEN nothing in the source folder
        WHEN it runs
        THEN nothing is planned`, () => {
      expect(split({ [`${root}/es.json`]: '' })).toEqual([]);
    });
  });

  describe('problems in the files', () => {
    it(`GIVEN a joined file that is not valid JSON
        WHEN it runs
        THEN it fails naming the file`, () => {
      expect(() =>
        split({ 'dist-i18n/es.json': '{ "hi": ', [`${root}/es.json`]: '' }),
      ).toThrow(/^Invalid JSON in dist-i18n\/es.json: /);
    });
  });
});
