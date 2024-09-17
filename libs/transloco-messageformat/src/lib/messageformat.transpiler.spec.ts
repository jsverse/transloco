import {
  defaultConfig,
  flatten,
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

  it('should work with locales', () => {
    const config = { locales: 'en-GB' };
    const parser = getTranspiler(config);
    const message =
      '{count, plural, =0{No} one{A} other{Several}} {count, plural, one{word} other{words}}';

    const result = parser.transpile(
      getTranspilerParams(message, { params: { count: 1 } }),
    );
    expect(result).toBe('A word');
  });

  it('should use passed-in formatters', () => {
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

  it('should switch locale in runtime', () => {
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

    it('should translate simple param and interpolate params inside messageformat string using custom interpolation markers', () => {
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

    it('should translate simple SELECT messageformat string from params when first param given', () => {
      const value =
        'The { gender, select, male {boy won his} female {girl won her} other {person won their}} race';
      const parsed = transpiler.transpile(
        getTranspilerParams(value, {
          params: { gender: 'male' },
        }),
      );
      expect(parsed).toEqual('The boy won his race');
    });

    it('should translate simple SELECT messageformat string from params when second param given', () => {
      const value =
        'The { gender, select, male {boy won his} female {girl won her} other {person won their}} race';
      const parsed = transpiler.transpile(
        getTranspilerParams(value, {
          params: { gender: 'female' },
        }),
      );
      expect(parsed).toEqual('The girl won her race');
    });

    it('should translate simple SELECT messageformat string from params when no param given', () => {
      const value =
        'The { gender, select, male {boy won his} female {girl won her} other {person won their}} race';
      const parsed = transpiler.transpile(
        getTranspilerParams(value, {
          params: { gender: '' },
        }),
      );
      expect(parsed).toEqual('The person won their race');
    });

    it('should translate simple params and SELECT messageformat string from params when no param given', () => {
      const value =
        'The {{value}} { gender, select, male {boy won his} female {girl won her} other {person won their}} race';
      const parsed = transpiler.transpile(
        getTranspilerParams(value, {
          params: { value: 'smart', gender: '' },
        }),
      );
      expect(parsed).toEqual('The smart person won their race');
    });

    it('should translate simple param and interpolate params inside messageformat string', () => {
      const value =
        'The {{ value }} { gender, select, male {boy named {{ name }} won his} female {girl named {{ name }} won her} other {person named {{ name }} won their}} race';
      const parsedMale = transpiler.transpile(
        getTranspilerParams(value, {
          params: { value: 'smart', gender: 'male', name: 'Henkie' },
        }),
      );
      expect(parsedMale).toEqual('The smart boy named Henkie won his race');
    });

    it('should translate simple string from params', () => {
      const parsed = transpiler.transpile(
        getTranspilerParams('Hello {{ value }}', {
          params: { value: 'World' },
        }),
      );
      expect(parsed).toEqual('Hello World');
    });

    it('should translate simple string with multiple params', () => {
      const parsed = transpiler.transpile(
        getTranspilerParams('Hello {{ from }} {{ name }}', {
          params: { from: 'from', name: 'Transloco' },
        }),
      );
      expect(parsed).toEqual('Hello from Transloco');
    });

    it('should translate simple string with a key from lang', () => {
      const parsed = transpiler.transpile(
        getTranspilerParams('Hello {{ world }}', {
          translation: { world: 'World' },
        }),
      );
      expect(parsed).toEqual('Hello World');
    });

    it('should translate simple string multiple keys from lang', () => {
      const lang = flatten({
        withKeys: 'with keys',
        from: 'from',
        lang: 'lang',
        nes: { ted: 'supporting nested values!' },
      });
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

    it('should translate simple string with params and from lang', () => {
      const parsed = transpiler.transpile(
        getTranspilerParams('Hello {{ from }} {{ name }}', {
          params: { name: 'Transloco' },
          translation: { from: 'from' },
        }),
      );
      expect(parsed).toEqual('Hello from Transloco');
    });

    it('should return the given value when the value is falsy', () => {
      expect(transpiler.transpile(getTranspilerParams(''))).toEqual('');
      expect(transpiler.transpile(getTranspilerParams(null))).toEqual(null);
      expect(transpiler.transpile(getTranspilerParams(undefined))).toEqual(
        undefined,
      );
    });

    it('should support params', () => {
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
