import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { migrateTemplate } from './template.js';

const fixtures = path.join(import.meta.dirname, 'tests/fixtures');
const app = 'src/app';

/** The templates of the fixtures, with the result expected of each. */
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
     THEN it comes out as expected`,
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
        warnings: [],
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
        warnings: [],
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
        warnings: [],
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
        warnings: [],
      });
    });

    it(`GIVEN a text over several lines
        WHEN it is migrated
        THEN the translation and the key are trimmed, with their white space collapsed`, () => {
      const { translation, template } = migrateTemplate(
        '<p i18n>\n  one\n  two\n</p>',
      );

      expect(translation).toEqual({ 'one-two': 'one two' });
      expect(template).toBe(`<p>{{ 'one-two' | transloco }}</p>`);
    });

    it(`GIVEN a template without marks
        WHEN it is migrated
        THEN it is the same and holds no translation`, () => {
      expect(migrateTemplate('<p>No marks</p>\r\n')).toEqual({
        template: '<p>No marks</p>\r\n',
        translation: {},
        warnings: [],
      });
    });
  });

  describe('the marks of attributes', () => {
    it.each([
      [
        `<img src="logo.png" title="Company logo" i18n-title />`,
        `<img src="logo.png" [title]="'company-logo' | transloco" />`,
      ],
      [
        `<input type="text" placeholder="Your name" i18n-placeholder>`,
        `<input type="text" [placeholder]="'your-name' | transloco">`,
      ],
      [
        `<input alt='Single quoted alt' i18n-alt>`,
        `<input [alt]="'single-quoted-alt' | transloco">`,
      ],
      [
        `<a title="x" i18n-title>Link</a>`,
        `<a [title]="'x' | transloco">Link</a>`,
      ],
      [
        `<div aria-label="Close" i18n-aria-label="@@close"></div>`,
        `<div [attr.aria-label]="'close' | transloco"></div>`,
      ],
    ])(
      `GIVEN %s
       WHEN it is migrated
       THEN the attribute is bound to the pipe, wherever the mark is`,
      (template, expected) => {
        expect(migrateTemplate(template)).toMatchObject({
          template: expected,
          warnings: [],
        });
      },
    );

    it(`GIVEN a mark whose id holds quotes
        WHEN it is migrated
        THEN the key is escaped for the template and the attribute`, () => {
      expect(
        migrateTemplate(
          `<a title="x" i18n-title="@@it's &quot;x&quot;">Link</a>`,
        ).template,
      ).toBe(`<a [title]="'it\\'s-&quot;x&quot;' | transloco">Link</a>`);
    });
  });

  describe('a mark the migration cannot convert', () => {
    it.each([
      [`<img i18n src="x.png">`, '<img i18n> is left as it is: it has no text'],
      [`<p i18n></p>`, '<p i18n> is left as it is: it has no text'],
      [
        `<p i18n>Hi {{ name }}</p>`,
        '<p i18n> is left as it is: it holds an interpolation, translate it by hand with params',
      ],
      [
        `<div i18n>A <b>bold</b> text</div>`,
        '<div i18n> is left as it is: it holds other elements, translate its texts by hand',
      ],
      [
        `<p i18n>{n, plural, =1 {one} other {many}}</p>`,
        '<p i18n> is left as it is: it holds an ICU message, give it an id (@@id)',
      ],
      [
        `<img i18n-title>`,
        '<img i18n-title> is left as it is: it has no title attribute',
      ],
      [
        `<img title="" i18n-title>`,
        '<img i18n-title> is left as it is: the title attribute has no text',
      ],
      [
        `<img title="Hi {{ name }}" i18n-title>`,
        '<img i18n-title> is left as it is: the title attribute holds an interpolation, translate it by hand with params',
      ],
    ])(
      `GIVEN %s
       WHEN it is migrated
       THEN it is left as it is, with a warning`,
      (template, message) => {
        expect(migrateTemplate(template)).toEqual({
          template,
          translation: {},
          warnings: [{ line: 1, message }],
        });
      },
    );

    it(`GIVEN marks around others and an inner text
        WHEN it is migrated
        THEN the outer ones are left with a warning, and the inner ones are migrated`, () => {
      expect(
        migrateTemplate(`<div i18n>\n  <p i18n>Inner</p>\n</div>`),
      ).toEqual({
        template: `<div i18n>\n  <p>{{ 'inner' | transloco }}</p>\n</div>`,
        translation: { inner: 'Inner' },
        warnings: [
          {
            line: 1,
            message:
              '<div i18n> is left as it is: it holds other elements, translate its texts by hand',
          },
        ],
      });
    });

    it(`GIVEN the text of an element in its attributes and its name
        WHEN it is migrated
        THEN only its content is replaced`, () => {
      expect(
        migrateTemplate(
          `<p class="p" i18n>p</p><span id="Save" i18n>Save</span>`,
        ).template,
      ).toBe(
        `<p class="p">{{ 'p' | transloco }}</p><span id="Save">{{ 'save' | transloco }}</span>`,
      );
    });

    it(`GIVEN marks inside control flow blocks
        WHEN it is migrated
        THEN they are migrated`, () => {
      expect(
        migrateTemplate(`@if (a) {<b i18n>Yes</b>} @else {<b i18n>No</b>}`)
          .template,
      ).toBe(
        `@if (a) {<b>{{ 'yes' | transloco }}</b>} @else {<b>{{ 'no' | transloco }}</b>}`,
      );
    });

    it(`GIVEN a template that doesn't parse
        WHEN it is migrated
        THEN it is left as it is, with a warning`, () => {
      const { template, translation, warnings } =
        migrateTemplate(`<p i18n>One</b>`);

      expect(template).toBe(`<p i18n>One</b>`);
      expect(translation).toEqual({});
      expect(warnings).toHaveLength(1);
      expect(warnings[0].message).toMatch(/^The template can't be parsed/);
    });
  });
});
