import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { migrateTemplate } from './template.js';

const fixtures = path.join(import.meta.dirname, 'tests/fixtures');
const app = 'src/app';

/** The templates of the fixtures, with the result the schematic gave for each, recorded before it moved. */
const templates = fs
  .readdirSync(path.join(fixtures, 'input', app), { recursive: true })
  .map(String)
  .filter((file) => file.endsWith('.html'))
  .sort();

describe('migrateTemplate', () => {
  it(`GIVEN the fixtures
      WHEN they are listed
      THEN there are templates of every kind the marks come in`, () => {
    expect(templates.length).toBeGreaterThanOrEqual(12);
  });

  it.each(templates)(
    `GIVEN the template %s
     WHEN it is migrated
     THEN it comes out as the schematic wrote it`,
    (file) => {
      const input = fs.readFileSync(
        path.join(fixtures, 'input', app, file),
        'utf8',
      );
      const expected = fs.readFileSync(
        path.join(fixtures, 'expected', app, file),
        'utf8',
      );

      expect(migrateTemplate(input).template).toBe(expected);
    },
  );

  describe('the translations', () => {
    it(`GIVEN a mark without a value
        WHEN it is migrated
        THEN the key is the dasherized text`, () => {
      expect(migrateTemplate('<h1 i18n>Hello world</h1>')).toEqual({
        template: `<h1>{{ 'hello-world' | transloco }}</h1>`,
        translation: { 'hello-world': 'Hello world' },
      });
    });

    it(`GIVEN a mark with an id
        WHEN it is migrated
        THEN the id is the key, dasherized`, () => {
      expect(
        migrateTemplate('<p i18n="@@someCamelCaseKey">Camel case id</p>'),
      ).toEqual({
        template: `<p>{{ 'some-camel-case-key' | transloco }}</p>`,
        translation: { 'some-camel-case-key': 'Camel case id' },
      });
    });

    it(`GIVEN a mark with a description and an id
        WHEN it is migrated
        THEN the description is kept as the comment of the key`, () => {
      expect(
        migrateTemplate('<p i18n="Greets the user@@greet">Hi there</p>'),
      ).toEqual({
        template: `<p>{{ 'greet' | transloco }}</p>`,
        translation: { greet: 'Hi there', 'greet.comment': 'Greets the user' },
      });
    });

    it(`GIVEN a mark with a meaning, a description and an id
        WHEN it is migrated
        THEN the key goes below the meaning, with its comment`, () => {
      expect(
        migrateTemplate(
          '<h2 i18n="site header|An introduction@@intro">Hello i18n!</h2>',
        ),
      ).toEqual({
        template: `<h2>{{ 'intro' | transloco }}</h2>`,
        translation: {
          'site header': {
            intro: 'Hello i18n!',
            'intro.comment': 'An introduction',
          },
        },
      });
    });

    it(`GIVEN a text over several lines
        WHEN it is migrated
        THEN the translation is trimmed and has no line breaks, and the key holds them`, () => {
      const { translation, template } = migrateTemplate(
        '<p i18n>\n  one\n  two\n</p>',
      );

      expect(translation).toEqual({ '\n--one\n--two\n': 'one  two' });
      expect(template).toBe(`<p>{{ '\n--one\n--two\n' | transloco }}</p>`);
    });

    it(`GIVEN a template without marks
        WHEN it is migrated
        THEN it is the same and holds no translation`, () => {
      expect(migrateTemplate('<p>No marks</p>\r\n')).toEqual({
        template: '<p>No marks</p>\r\n',
        translation: {},
      });
    });
  });

  describe('a mark the migration cannot make a key of', () => {
    it.each([
      `<img src="logo.png" title="Company logo" i18n-title />`,
      `<input type="text" placeholder="Your name" i18n-placeholder>`,
      `<input alt='Single quoted alt' i18n-alt>`,
      `<img title="Logo" i18n-title>`,
    ])(
      `GIVEN %s
       WHEN it is migrated
       THEN it throws, as it always did`,
      (template) => {
        expect(() => migrateTemplate(template)).toThrow(
          new TypeError(
            "Cannot read properties of undefined (reading 'replace')",
          ),
        );
      },
    );

    it(`GIVEN a template that threw
        WHEN the next one is migrated
        THEN it is read from its start`, () => {
      expect(() =>
        migrateTemplate(`<p i18n>one</p><img title="Logo" i18n-title>`),
      ).toThrow();

      expect(migrateTemplate('<p i18n>one</p>').translation).toEqual({
        one: 'one',
      });
    });
  });
});
