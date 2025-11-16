import {
  defaultConfig,
  provideTranslocoConfig,
  TRANSLOCO_TRANSPILER,
  translocoConfig,
  TranslocoConfig,
  TranspileParams,
} from '@jsverse/transloco';
import { CustomFormatter } from '@messageformat/core';
import { TestBed } from '@angular/core/testing';

import { MessageFormatTranspiler } from './messageformat.transpiler';
import { MessageformatConfig } from './messageformat.config';
import { provideTranslocoMessageformat } from './messageformat.providers';

function getTranspiler(
  config?: MessageformatConfig,
  translocoConfig: TranslocoConfig = defaultConfig,
) {
  return TestBed.configureTestingModule({
    providers: [
      provideTranslocoConfig(translocoConfig),
      provideTranslocoMessageformat(config),
    ],
  }).inject<MessageFormatTranspiler>(TRANSLOCO_TRANSPILER);
}

function getTranspilerParams(
  value: unknown,
  overrides?: Partial<Omit<TranspileParams, 'value'>>,
): TranspileParams {
  return {
    value,
    key: 'key',
    translation: {},
    ...overrides,
  };
}

describe('MessageFormatTranspiler', () => {
  assertParser('Cache enabled', {});

  assertParser('Cache disabled', { enableCache: false });

  it(`GIVEN transpiler configured with en-GB locale
      WHEN transpiling plural messageformat with count=1
      THEN returns correctly formatted singular form`, () => {
    const config = { locales: 'en-GB' };
    const parser = getTranspiler(config);
    const message =
      '{count, plural, =0{No} one{A} other{Several}} {count, plural, one{word} other{words}}';

    const result = parser.transpile(
      getTranspilerParams(message, { params: { count: 1 } }),
    );
    expect(result).toBe('A word');
  });

  it(`GIVEN transpiler with custom formatters (prop, upcase)
      WHEN transpiling messages using custom formatters
      THEN applies custom formatters correctly to params`, () => {
    const formatters: { [key: string]: CustomFormatter } = {
      prop: <T = Record<string, string>>(v: T, lc: any, p: string | null) =>
        v[p as keyof T],
      upcase: (v) => (v as string).toUpperCase(),
    };
    const messages = {
      answer: 'Answer: {obj, prop, a}',
      describe: 'This is {upper, upcase}.',
    };

    const transpiler = getTranspiler({
      customFormatters: formatters,
    });
    const upper = transpiler.transpile(
      getTranspilerParams(messages.describe, {
        params: { upper: 'big' },
      }),
    );
    expect(upper).toEqual('This is BIG.');

    expect(
      transpiler.transpile(
        getTranspilerParams(messages.answer, {
          params: { obj: { q: 3, a: 42 } },
        }),
      ),
    ).toBe('Answer: 42');
  });

  it(`GIVEN transpiler initialized with en locale
      WHEN locale is switched to pl at runtime
      THEN transpiles Polish plural rules correctly`, () => {
    const config = { locales: 'en' };
    const transpiler = getTranspiler(config);
    const polishKey =
      '{count, plural, =0 {none} one {# thing} few {# things} many {# things} other {# things}}';
    const params = { count: 2 };

    expect(() =>
      transpiler.transpile(getTranspilerParams(polishKey, { params })),
    ).toThrowError();
    transpiler.setLocale('pl');
    expect(
      transpiler.transpile(getTranspilerParams(polishKey, { params })),
    ).toBe('2 things');
  });
});

function assertParser(description: string, config: MessageformatConfig) {
  describe(`${description} - custom interpolation`, () => {
    let transpiler: MessageFormatTranspiler;
    beforeEach(() => {
      transpiler = getTranspiler(
        config,
        translocoConfig({ interpolation: ['<<<', '>>>'] }),
      );
    });

    it(`GIVEN transpiler with custom interpolation markers (<<< >>>)
        WHEN transpiling params and messageformat select with male gender
        THEN interpolates params and applies gender selection correctly`, () => {
      const parsedMale = transpiler.transpile(
        getTranspilerParams(
          'The <<< value >>> { gender, select, male {boy named <<< name >>> won his} female {girl named <<< name >>> won her} other {person named <<< name >>> won their}} race',
          {
            params: { value: 'smart', gender: 'male', name: 'Henkie' },
          },
        ),
      );
      expect(parsedMale).toEqual('The smart boy named Henkie won his race');
    });
  });

  describe(`${description} - default interpolation`, () => {
    let transpiler: MessageFormatTranspiler;

    beforeEach(() => {
      transpiler = getTranspiler(config);
    });

    it(`GIVEN SELECT messageformat string
        WHEN transpiling with gender param set to 'male'
        THEN returns male-specific text`, () => {
      const value =
        'The { gender, select, male {boy won his} female {girl won her} other {person won their}} race';
      const parsed = transpiler.transpile(
        getTranspilerParams(value, {
          params: { gender: 'male' },
        }),
      );
      expect(parsed).toEqual('The boy won his race');
    });

    it(`GIVEN SELECT messageformat string
        WHEN transpiling with gender param set to 'female'
        THEN returns female-specific text`, () => {
      const value =
        'The { gender, select, male {boy won his} female {girl won her} other {person won their}} race';
      const parsed = transpiler.transpile(
        getTranspilerParams(value, {
          params: { gender: 'female' },
        }),
      );
      expect(parsed).toEqual('The girl won her race');
    });

    it(`GIVEN SELECT messageformat string
        WHEN transpiling with empty gender param
        THEN returns 'other' case text`, () => {
      const value =
        'The { gender, select, male {boy won his} female {girl won her} other {person won their}} race';
      const parsed = transpiler.transpile(
        getTranspilerParams(value, {
          params: { gender: '' },
        }),
      );
      expect(parsed).toEqual('The person won their race');
    });

    it(`GIVEN string with simple param interpolation and SELECT messageformat
        WHEN transpiling with value param and empty gender param
        THEN interpolates value and returns 'other' case text`, () => {
      const value =
        'The {{value}} { gender, select, male {boy won his} female {girl won her} other {person won their}} race';
      const parsed = transpiler.transpile(
        getTranspilerParams(value, {
          params: { value: 'smart', gender: '' },
        }),
      );
      expect(parsed).toEqual('The smart person won their race');
    });

    it(`GIVEN string with params inside and outside messageformat SELECT
        WHEN transpiling with value, male gender, and name params
        THEN interpolates all params and applies gender selection`, () => {
      const value =
        'The {{ value }} { gender, select, male {boy named {{ name }} won his} female {girl named {{ name }} won her} other {person named {{ name }} won their}} race';
      const parsedMale = transpiler.transpile(
        getTranspilerParams(value, {
          params: { value: 'smart', gender: 'male', name: 'Henkie' },
        }),
      );
      expect(parsedMale).toEqual('The smart boy named Henkie won his race');
    });

    it(`GIVEN simple string with single param placeholder
        WHEN transpiling with value param
        THEN interpolates param correctly`, () => {
      const parsed = transpiler.transpile(
        getTranspilerParams('Hello {{ value }}', {
          params: { value: 'World' },
        }),
      );
      expect(parsed).toEqual('Hello World');
    });

    it(`GIVEN simple string with multiple param placeholders
        WHEN transpiling with from and name params
        THEN interpolates all params correctly`, () => {
      const parsed = transpiler.transpile(
        getTranspilerParams('Hello {{ from }} {{ name }}', {
          params: { from: 'from', name: 'Transloco' },
        }),
      );
      expect(parsed).toEqual('Hello from Transloco');
    });

    it(`GIVEN simple string with param placeholder
        WHEN transpiling with key from translation object
        THEN resolves value from translation object`, () => {
      const parsed = transpiler.transpile(
        getTranspilerParams('Hello {{ world }}', {
          translation: { world: 'World' },
        }),
      );
      expect(parsed).toEqual('Hello World');
    });

    it(`GIVEN string with multiple param placeholders including nested keys
        WHEN transpiling with keys from translation object
        THEN resolves all values including nested keys from translation object`, () => {
      const lang = {
        withKeys: 'with keys',
        from: 'from',
        lang: 'lang',
        'nes.ted': 'supporting nested values!',
      };
      const parsed = transpiler.transpile(
        getTranspilerParams(
          'Hello {{ withKeys }} {{ from }} {{ lang }} {{nes.ted}}',
          {
            translation: lang,
          },
        ),
      );
      expect(parsed).toEqual(
        'Hello with keys from lang supporting nested values!',
      );
    });

    it(`GIVEN string with multiple param placeholders
        WHEN transpiling with mixed params and translation object values
        THEN resolves values from both params and translation object`, () => {
      const parsed = transpiler.transpile(
        getTranspilerParams('Hello {{ from }} {{ name }}', {
          params: { name: 'Transloco' },
          translation: { from: 'from' },
        }),
      );
      expect(parsed).toEqual('Hello from Transloco');
    });

    it(`GIVEN falsy values (empty string, null, undefined)
        WHEN transpiling
        THEN returns the falsy value unchanged`, () => {
      expect(transpiler.transpile(getTranspilerParams(''))).toEqual('');
      expect(transpiler.transpile(getTranspilerParams(null))).toEqual(null);
      expect(transpiler.transpile(getTranspilerParams(undefined))).toEqual(
        undefined,
      );
    });

    it(`GIVEN nested translation object with messageformat strings
        WHEN transpiling with params for each nested key
        THEN transpiles all nested messageformat strings with their respective params`, () => {
      const translations = {
        nested: {
          messageFormatWithParams:
            'Can replace {{value}} and also give parse messageformat: The {gender, select, male {boy won his} female {girl won her} other {person won their}} race - english',
          people: '{count, plural, =1 {person} other {people}}',
          moreNesting: {
            projects: '{count, plural, =1 {project} other {projects}}',
          },
        },
      };

      expect(
        transpiler.transpile(
          getTranspilerParams(translations.nested, {
            params: {
              messageFormatWithParams: { value: 'Hey', gender: 'female' },
              people: { count: '1' },
              'moreNesting.projects': { count: '1' },
            },
          }),
        ),
      ).toEqual({
        messageFormatWithParams:
          'Can replace Hey and also give parse messageformat: The girl won her race - english',
        people: 'person',
        moreNesting: {
          projects: 'project',
        },
      });
    });
  });
}
