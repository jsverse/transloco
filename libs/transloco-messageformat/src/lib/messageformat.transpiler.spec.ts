import {
  defaultConfig,
  provideTranslocoConfig,
  TRANSLOCO_TRANSPILER,
  translocoConfig,
  TranslocoConfig,
  TranspileParams,
} from '@jsverse/transloco';
import MessageFormat, { CustomFormatter } from '@messageformat/core';
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

  it(`GIVEN transpiler with custom formatters (prop)
      WHEN transpiling with an object param and a string param containing braces
      THEN passes the object to the formatter untouched and renders the string literally`, () => {
    const transpiler = getTranspiler({
      customFormatters: {
        prop: (v, _lc, p) => (v as Record<string, unknown>)[p as string],
      },
    });
    const parsed = transpiler.transpile(
      getTranspilerParams('Answer: {obj, prop, a} for {{ id }}', {
        params: { obj: { q: 3, a: 42 }, id: '{1234-5678}' },
      }),
    );
    expect(parsed).toEqual('Answer: 42 for {1234-5678}');
  });

  it(`GIVEN transpiler configured with requireAllArguments
      WHEN transpiling with a param value containing braces
      THEN renders the value literally and still requires the real arguments`, () => {
    const transpiler = getTranspiler({ requireAllArguments: true });
    const value = 'UUID: {{ value }} {count, number}';
    expect(
      transpiler.transpile(
        getTranspilerParams(value, {
          params: { value: '{1234-5678}', count: 3 },
        }),
      ),
    ).toEqual('UUID: {1234-5678} 3');
    expect(() =>
      transpiler.transpile(
        getTranspilerParams(value, { params: { value: '{1234-5678}' } }),
      ),
    ).toThrowError();
  });

  it(`KNOWN LIMITATION - GIVEN a custom formatter reached through a referenced
      translation key
      WHEN transpiling with a param value containing braces used only by
      that formatter
      THEN the formatter does not receive the raw value
      (see protectParams's doc comment)`, () => {
    const transpiler = getTranspiler({
      customFormatters: { upcase: (v) => (v as string).toUpperCase() },
    });
    const parsed = transpiler.transpile(
      getTranspilerParams('Hello {{ ref }}', {
        params: { name: '{secret}' },
        translation: { ref: '{name, upcase}' },
      }),
    );
    // Desired output would be 'Hello {SECRET}', matching pre-#898-fix
    // behavior for this specific shape; documented as out of scope. A param
    // value containing only '#' (no braces) is unaffected by this limit,
    // since it never needs protecting in the first place (see PROTECT_CHARS).
    expect(parsed).toEqual('Hello undefined');
  });

  it(`GIVEN a params object with a circular reference
      WHEN transpiling with a param value containing braces
      THEN protects the value without recursing forever`, () => {
    const transpiler = getTranspiler({});
    const user: Record<string, unknown> = { id: '{1234-5678}' };
    user['self'] = user;
    const parsed = transpiler.transpile(
      getTranspilerParams('UUID: {{ user.id }}', { params: { user } }),
    );
    expect(parsed).toEqual('UUID: {1234-5678}');
  });

  it(`GIVEN a params object with a circular reference walked before its
      value containing braces
      WHEN transpiling that value through the cycle
      THEN protects it on that path too`, () => {
    const transpiler = getTranspiler({});
    const user: Record<string, unknown> = {};
    user['self'] = user;
    user['id'] = '{1234-5678}';
    const parsed = transpiler.transpile(
      getTranspilerParams('UUID: {{ user.self.self.id }}', {
        params: { user },
      }),
    );
    expect(parsed).toEqual('UUID: {1234-5678}');
  });

  it(`GIVEN two params objects that reference each other
      WHEN transpiling a value containing braces through the cycle
      THEN protects it on that path too`, () => {
    const transpiler = getTranspiler({});
    const user: Record<string, unknown> = { id: '{1234-5678}' };
    user['team'] = { owner: user };
    const parsed = transpiler.transpile(
      getTranspilerParams('Owner: {{ user.team.owner.id }}', {
        params: { user },
      }),
    );
    expect(parsed).toEqual('Owner: {1234-5678}');
  });

  it(`GIVEN a params object where the same nested object is referenced by two keys
      WHEN transpiling with a param value containing braces
      THEN protects the value through both references`, () => {
    const transpiler = getTranspiler({});
    const shared = { id: '{1234-5678}' };
    const parsed = transpiler.transpile(
      getTranspilerParams('{{ a.id }} / {{ b.id }}', {
        params: { a: shared, b: shared },
      }),
    );
    expect(parsed).toEqual('{1234-5678} / {1234-5678}');
  });

  it(`GIVEN a param literally named like a generated placeholder
      WHEN transpiling with another param value containing braces
      THEN keeps the literally-named param's own value intact`, () => {
    const transpiler = getTranspiler({});
    const parsed = transpiler.transpile(
      getTranspilerParams('{{ name }}: {{ __translocoParam0 }}', {
        params: { name: '{secret}', __translocoParam0: 'ordinary' },
      }),
    );
    expect(parsed).toEqual('{secret}: ordinary');
  });

  it(`GIVEN an unused param whose value contains braces
      WHEN transpiling a message that already quotes text shaped like a
      generated placeholder
      THEN leaves that quoted text exactly as written`, () => {
    const transpiler = getTranspiler({});
    const parsed = transpiler.transpile(
      getTranspilerParams("'{__translocoParam0}'", {
        params: { unused: '{oops}' },
      }),
    );
    expect(parsed).toEqual('{__translocoParam0}');
  });

  it(`GIVEN an unused param whose value contains braces
      WHEN transpiling a message that references our reserved name as a real
      ICU argument with whitespace and requireAllArguments enabled
      THEN still reports it missing instead of silently supplying it`, () => {
    const transpiler = getTranspiler({ requireAllArguments: true });
    expect(() =>
      transpiler.transpile(
        getTranspilerParams('{ __translocoParam0 }', {
          params: { unused: '{secret}' },
        }),
      ),
    ).toThrowError();
  });

  it(`GIVEN a params object shaped like a DAG where each level shares its
      child with a sibling (so the object graph is linear in size, not
      exponential)
      WHEN transpiling with a param value containing braces deep in the graph
      THEN completes quickly instead of re-traversing shared nodes
      exponentially`, () => {
    const transpiler = getTranspiler({});
    let node: Record<string, unknown> = { leaf: '{deep}' };
    for (let i = 0; i < 22; i++) {
      node = { a: node, b: node };
    }
    const start = performance.now();
    const parsed = transpiler.transpile(
      getTranspilerParams('Hi', { params: { root: node } }),
    );
    const elapsed = performance.now() - start;
    expect(parsed).toEqual('Hi');
    expect(elapsed).toBeLessThan(500);
  });

  it(`GIVEN hand-authored text shaped like a generated placeholder, quoted to
      show a literal brace
      WHEN transpiling with no params
      THEN leaves it exactly as written instead of treating it as one of ours`, () => {
    const transpiler = getTranspiler({});
    const parsed = transpiler.transpile(
      getTranspilerParams("'{__translocoParam0}'", { params: {} }),
    );
    expect(parsed).toEqual('{__translocoParam0}');
  });

  it(`GIVEN a transpiler with caching enabled
      WHEN transpiling the same template and param value containing braces twice
      THEN compiles the underlying message only once`, () => {
    // cachedFactory wraps MessageFormat#compile and only calls through to it
    // on a cache miss, keyed by the fully-interpolated text. Placeholder
    // names must therefore be stable across calls for the same input, or
    // every call would produce different text and never hit the cache.
    const compileSpy = vi.spyOn(MessageFormat.prototype, 'compile');
    const transpiler = getTranspiler({});
    const params = { name: '{secret}' };
    transpiler.transpile(getTranspilerParams('Hi {{ name }}', { params }));
    transpiler.transpile(getTranspilerParams('Hi {{ name }}', { params }));
    expect(compileSpy).toHaveBeenCalledTimes(1);
  });

  it(`GIVEN a param value containing only '#' (a MessageFormat number-skeleton
      pattern), interpolated into a 'number' argument's pattern position
      WHEN transpiling with an amount
      THEN keeps the pattern as ICU syntax so it still formats at compile time`, () => {
    const transpiler = getTranspiler({});
    const parsed = transpiler.transpile(
      getTranspilerParams('{amount, number, {{ fmt }}}', {
        params: { amount: 12, fmt: '¤#,##0.00' },
      }),
    );
    expect(parsed).toEqual('$12.00');
  });

  it(`GIVEN nested translation object with an entry that has no params of its own
      WHEN transpiling
      THEN leaves that entry unchanged instead of throwing`, () => {
    const transpiler = getTranspiler({});
    const parsed = transpiler.transpile(
      getTranspilerParams(
        { foo: 'Hi', bar: 'UUID: {{ value }}' },
        { params: { foo: undefined, bar: { value: '{1234-5678}' } } },
      ),
    );
    expect(parsed).toEqual({ foo: 'Hi', bar: 'UUID: {1234-5678}' });
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

    it(`GIVEN transpiler with custom interpolation markers (<<< >>>)
        WHEN transpiling with a param value containing braces
        THEN renders the value as literal text`, () => {
      const parsed = transpiler.transpile(
        getTranspilerParams('UUID: <<< value >>>', {
          params: { value: '{1234-5678}' },
        }),
      );
      expect(parsed).toEqual('UUID: {1234-5678}');
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

    it(`GIVEN string with a param placeholder
        WHEN transpiling with a param value wrapped in braces (#898)
        THEN renders the value as literal text`, () => {
      const parsed = transpiler.transpile(
        getTranspilerParams('UUID: {{value}}', {
          params: { value: '{1234-5678}' },
        }),
      );
      expect(parsed).toEqual('UUID: {1234-5678}');
    });

    it(`GIVEN string with a param placeholder
        WHEN transpiling twice with different param values containing braces
        THEN renders each value literally`, () => {
      const value = 'UUID: {{ value }}';
      expect(
        transpiler.transpile(
          getTranspilerParams(value, { params: { value: '{1234-5678}' } }),
        ),
      ).toEqual('UUID: {1234-5678}');
      expect(
        transpiler.transpile(
          getTranspilerParams(value, { params: { value: '{8765-4321}' } }),
        ),
      ).toEqual('UUID: {8765-4321}');
    });

    it(`GIVEN SELECT messageformat string with a param placeholder inside a case
        WHEN transpiling with a param value containing braces
        THEN renders the value literally inside the selected case`, () => {
      const value =
        'The {gender, select, male {boy {{ tag }} won his} other {person {{ tag }} won their}} race';
      const parsed = transpiler.transpile(
        getTranspilerParams(value, {
          params: { gender: 'male', tag: '{1234-5678}' },
        }),
      );
      expect(parsed).toEqual('The boy {1234-5678} won his race');
    });

    it(`GIVEN PLURAL messageformat string with a param placeholder inside a case
        WHEN transpiling with a param value containing braces
        THEN renders the value literally and still replaces the case '#'`, () => {
      const value =
        '{count, plural, one {# item for {{ ref }}} other {# items for {{ ref }}}}';
      const parsed = transpiler.transpile(
        getTranspilerParams(value, { params: { count: 2, ref: '{ref#7}' } }),
      );
      expect(parsed).toEqual('2 items for {ref#7}');
    });

    it(`KNOWN LIMITATION - GIVEN PLURAL messageformat string with a param
        placeholder inside a case
        WHEN transpiling with a param value containing only '#' (no braces)
        THEN the case's own '#' AND the value's '#' are both replaced by the
        count, corrupting the value, instead of only the case's own
        (see PROTECT_CHARS's comment: needed to avoid breaking MessageFormat
        number-skeleton patterns, which also rely on a bare '#')`, () => {
      const value =
        '{count, plural, one {# item for {{ ref }}} other {# items for {{ ref }}}}';
      const parsed = transpiler.transpile(
        getTranspilerParams(value, { params: { count: 2, ref: 'ref#7' } }),
      );
      // Desired output would be '2 items for ref#7', matching pre-#898-fix
      // behavior for this specific shape; documented as out of scope.
      expect(parsed).toEqual('2 items for ref27');
    });

    it(`GIVEN string with an apostrophe right after a param placeholder
        WHEN transpiling with a param value containing braces
        THEN keeps the apostrophe and renders the value literally`, () => {
      const parsed = transpiler.transpile(
        getTranspilerParams("Order {{ id }}'s status", {
          params: { id: '{1234-5678}' },
        }),
      );
      expect(parsed).toEqual("Order {1234-5678}'s status");
    });

    it(`GIVEN string with an apostrophe right before a param placeholder and another one later
        WHEN transpiling with a param value containing braces
        THEN keeps both apostrophes and renders the value literally`, () => {
      const parsed = transpiler.transpile(
        getTranspilerParams("L'{{ item }} n'est pas disponible", {
          params: { item: '{1234-5678}' },
        }),
      );
      expect(parsed).toEqual("L'{1234-5678} n'est pas disponible");
    });

    it(`GIVEN a translation that already uses ICU quoting to show a literal brace,
        followed by a param placeholder
        WHEN transpiling with a param value containing braces
        THEN leaves the existing quoting untouched and renders the value literally`, () => {
      const parsed = transpiler.transpile(
        getTranspilerParams("'{x}'{{ name }}", {
          params: { name: '{secret}' },
        }),
      );
      expect(parsed).toEqual('{x}{secret}');
    });

    it(`GIVEN a translation that quotes an escaped apostrophe inside literal braces,
        followed by a param placeholder
        THEN leaves the existing quoting untouched and renders the value literally`, () => {
      const parsed = transpiler.transpile(
        getTranspilerParams("'{x''y}'{{ name }}", {
          params: { name: '{secret}' },
        }),
      );
      expect(parsed).toEqual("{x'y}{secret}");
    });

    it(`GIVEN two adjacent param placeholders separated only by an apostrophe
        WHEN transpiling with both param values containing braces
        THEN renders both values literally with the apostrophe intact`, () => {
      const parsed = transpiler.transpile(
        getTranspilerParams("{{ a }}'{{ b }}", {
          params: { a: '{1}', b: '{2}' },
        }),
      );
      expect(parsed).toEqual("{1}'{2}");
    });

    it(`KNOWN LIMITATION - GIVEN a param placeholder fully enclosed by ICU quoting
        on both sides (escaping literal braces)
        WHEN transpiling with a param value containing braces
        THEN the placeholder stays quoted and unresolved instead of literal
        (see protectParams's doc comment)`, () => {
      const parsed = transpiler.transpile(
        getTranspilerParams("'{ {{ name }} }'", {
          params: { name: '{secret}' },
        }),
      );
      // Desired output would be '{ {secret} }', matching pre-#898-fix
      // behavior for this specific shape; documented as out of scope.
      expect(parsed).toEqual('{ {__translocoParam0} }');
    });

    it(`GIVEN nested translation object with a param placeholder
        WHEN transpiling with a nested-key param value containing braces
        THEN renders the value literally in the nested key`, () => {
      const translations = { nested: { uuid: 'UUID: {{ value }}' } };
      expect(
        transpiler.transpile(
          getTranspilerParams(translations, {
            params: { 'nested.uuid': { value: '{1234-5678}' } },
          }),
        ),
      ).toEqual({ nested: { uuid: 'UUID: {1234-5678}' } });
    });

    it(`GIVEN string with a dotted param placeholder
        WHEN transpiling with a nested object param or a literal dotted key containing braces
        THEN renders the value literally in both cases`, () => {
      const value = 'UUID: {{ user.id }}';
      expect(
        transpiler.transpile(
          getTranspilerParams(value, {
            params: { user: { id: '{1234-5678}' } },
          }),
        ),
      ).toEqual('UUID: {1234-5678}');
      expect(
        transpiler.transpile(
          getTranspilerParams(value, {
            params: { 'user.id': '{1234-5678}' },
          }),
        ),
      ).toEqual('UUID: {1234-5678}');
    });

    it(`GIVEN string referencing a translation key that interpolates a param
        WHEN transpiling with a param value containing braces
        THEN renders the value literally through the referenced key`, () => {
      const parsed = transpiler.transpile(
        getTranspilerParams('Hello {{ uuid }}', {
          params: { value: '{1234-5678}' },
          translation: { uuid: 'UUID: {{ value }}' },
        }),
      );
      expect(parsed).toEqual('Hello UUID: {1234-5678}');
    });

    it(`GIVEN string with a param placeholder that is also a SELECT selector
        WHEN transpiling with a selector value containing braces
        THEN renders the value literally and selects the 'other' case`, () => {
      const value = '{{ gender }}: {gender, select, male {he} other {they}}';
      const parsed = transpiler.transpile(
        getTranspilerParams(value, { params: { gender: '{x}' } }),
      );
      expect(parsed).toEqual('{x}: they');
    });

    it(`GIVEN strings with param placeholders next to apostrophes
        WHEN transpiling with param values without messageformat characters
        THEN interpolates them unchanged`, () => {
      expect(
        transpiler.transpile(
          getTranspilerParams("Order {{ id }}'s status", {
            params: { id: 'A1' },
          }),
        ),
      ).toEqual("Order A1's status");
      expect(
        transpiler.transpile(
          getTranspilerParams("L'{{ item }} n'est pas disponible", {
            params: { item: 'eau' },
          }),
        ),
      ).toEqual("L'eau n'est pas disponible");
      expect(
        transpiler.transpile(
          getTranspilerParams('Hello {{ name }}', {
            params: { name: "O'Brien" },
          }),
        ),
      ).toEqual("Hello O'Brien");
    });

    it(`GIVEN string with param placeholders and PLURAL/SELECT arguments
        WHEN transpiling with number and boolean params
        THEN leaves the non-string params untouched`, () => {
      expect(
        transpiler.transpile(
          getTranspilerParams(
            '{{ count }}: {count, plural, one {# item} other {# items}}',
            { params: { count: 2 } },
          ),
        ),
      ).toEqual('2: 2 items');
      expect(
        transpiler.transpile(
          getTranspilerParams(
            '{{ flag }} {flag, select, true {yes} other {no}}',
            { params: { flag: true } },
          ),
        ),
      ).toEqual('true yes');
    });
  });
}
