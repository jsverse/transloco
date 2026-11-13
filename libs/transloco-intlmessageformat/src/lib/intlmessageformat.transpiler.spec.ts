import {
  defaultConfig,
  provideTranslocoConfig,
  TRANSLOCO_TRANSPILER,
  translocoConfig,
  TranslocoConfig,
  TranspileParams,
} from '@jsverse/transloco';
import { TestBed } from '@angular/core/testing';
import { IntlMessageFormat } from 'intl-messageformat';

import { IntlMessageFormatTranspiler } from './intlmessageformat.transpiler';
import { IntlMessageFormatConfig } from './intlmessageformat.config';
import { provideTranslocoIntlMessageFormat } from './intlmessageformat.providers';

function getTranspiler(
  config?: IntlMessageFormatConfig,
  translocoConfig: TranslocoConfig = defaultConfig,
) {
  return TestBed.configureTestingModule({
    providers: [
      provideTranslocoConfig(translocoConfig),
      provideTranslocoIntlMessageFormat(config),
    ],
  }).inject<IntlMessageFormatTranspiler>(TRANSLOCO_TRANSPILER);
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

describe('IntlMessageFormatTranspiler', () => {
  assertParser('No config', undefined);

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

  it(`GIVEN transpiler with a custom named number format
      WHEN transpiling a message using that format
      THEN applies the custom format to the param`, () => {
    const transpiler = getTranspiler({
      locales: 'en',
      formats: { number: { percentage: { style: 'percent' } } },
    });

    expect(
      transpiler.transpile(
        getTranspilerParams('Progress: {done, number, percentage}', {
          params: { done: 0.42 },
        }),
      ),
    ).toBe('Progress: 42%');
  });

  it(`GIVEN transpiler initialized with en locale
      WHEN locale is switched to pl at runtime
      THEN transpiles Polish plural rules correctly`, () => {
    const config = { locales: 'en' };
    const transpiler = getTranspiler(config);
    const polishKey =
      '{count, plural, one {# rzecz} few {# rzeczy} many {# rzeczy wiele} other {# rzeczy inne}}';
    const params = { count: 2 };

    expect(
      transpiler.transpile(getTranspilerParams(polishKey, { params })),
    ).toBe('2 rzeczy inne');
    transpiler.setLocale('pl');
    expect(
      transpiler.transpile(getTranspilerParams(polishKey, { params })),
    ).toBe('2 rzeczy');
  });

  it(`GIVEN transpiler initialized with en locale
      WHEN the active language changes to pl
      THEN transpiles Polish plural rules correctly`, () => {
    const transpiler = getTranspiler({ locales: 'en' });
    const polishKey =
      '{count, plural, one {# rzecz} few {# rzeczy} many {# rzeczy wiele} other {# rzeczy inne}}';

    transpiler.onLangChanged('pl');

    expect(
      transpiler.transpile(
        getTranspilerParams(polishKey, { params: { count: 5 } }),
      ),
    ).toBe('5 rzeczy wiele');
  });

  it(`GIVEN a translation containing HTML
      WHEN transpiling with the default options
      THEN keeps the HTML as text`, () => {
    const transpiler = getTranspiler();

    expect(
      transpiler.transpile(
        getTranspilerParams('Hello <b>{name}</b><br>', {
          params: { name: 'Transloco' },
        }),
      ),
    ).toBe('Hello <b>Transloco</b><br>');
  });

  it(`GIVEN transpiler with ignoreTag disabled
      WHEN transpiling a translation with a rich text tag
      THEN formats the tag with the given function`, () => {
    const transpiler = getTranspiler({ opts: { ignoreTag: false } });

    expect(
      transpiler.transpile(
        getTranspilerParams('Hello <b>{name}</b>', {
          params: {
            name: 'Transloco',
            b: (chunks: string[]) => `**${chunks.join('')}**`,
          },
        }),
      ),
    ).toBe('Hello **Transloco**');
  });

  it(`GIVEN transpiler with cache enabled
      WHEN transpiling the same message with different params
      THEN parses the message once and formats each params set`, () => {
    const parse = vi.spyOn(IntlMessageFormat, '__parse');
    const transpiler = getTranspiler({ locales: 'en' });
    const message = '{count, plural, one {# item} other {# items}}';

    const single = transpiler.transpile(
      getTranspilerParams(message, { params: { count: 1 } }),
    );
    const multiple = transpiler.transpile(
      getTranspilerParams(message, { params: { count: 3 } }),
    );

    expect(single).toBe('1 item');
    expect(multiple).toBe('3 items');
    expect(parse).toHaveBeenCalledTimes(1);
    parse.mockRestore();
  });

  it(`GIVEN transpiler with cache disabled
      WHEN transpiling the same message twice
      THEN parses the message each time`, () => {
    const parse = vi.spyOn(IntlMessageFormat, '__parse');
    const transpiler = getTranspiler({ locales: 'en', enableCache: false });
    const message = '{count, plural, one {# item} other {# items}}';

    transpiler.transpile(
      getTranspilerParams(message, { params: { count: 1 } }),
    );
    transpiler.transpile(
      getTranspilerParams(message, { params: { count: 3 } }),
    );

    expect(parse).toHaveBeenCalledTimes(2);
    parse.mockRestore();
  });
});

function assertParser(description: string, config?: IntlMessageFormatConfig) {
  describe(`${description} - custom interpolation`, () => {
    let transpiler: IntlMessageFormatTranspiler;
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
    let transpiler: IntlMessageFormatTranspiler;

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
