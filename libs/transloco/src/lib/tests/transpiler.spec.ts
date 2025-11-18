import { Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  FunctionalTranspiler,
  getFunctionArgs,
  TRANSLOCO_TRANSPILER,
  TranslocoTranspiler,
  TranspileParams,
} from '../transloco.transpiler';
import {
  defaultConfig,
  TranslocoConfig,
  translocoConfig,
} from '../transloco.config';
import {
  provideTransloco,
  provideTranslocoTranspiler,
} from '../transloco.providers';
import { flatten } from '../utils/flat.utils';

import { transpilerFunctions } from './mocks';

const injectorMock = {
  get: (key: keyof typeof transpilerFunctions) => transpilerFunctions[key],
};

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

function transpilerFactory(config: TranslocoConfig = defaultConfig) {
  return function getTranspiler() {
    return TestBed.configureTestingModule({
      providers: [provideTransloco({ config })],
    }).inject(TRANSLOCO_TRANSPILER);
  };
}

function functionTranspilerFactory() {
  return function getFunctionalTranspiler() {
    return TestBed.configureTestingModule({
      providers: [
        { provide: Injector, useValue: injectorMock },
        provideTranslocoTranspiler(FunctionalTranspiler),
      ],
    }).inject(TRANSLOCO_TRANSPILER);
  };
}

describe('TranslocoTranspiler', () => {
  describe('DefaultTranspiler', () => {
    withDefaultBehaviorTests(transpilerFactory());
  });

  describe('DefaultTranspiler with custom interpolation', () => {
    const interpolation: [string, string] = ['<<', '>>'];
    withDefaultBehaviorTests(
      transpilerFactory(translocoConfig({ interpolation })),
      interpolation,
    );
  });

  describe('FunctionalTranspiler', () => {
    withDefaultBehaviorTests(functionTranspilerFactory());
  });

  describe('FunctionalTranspiler', () => {
    let transpiler: TranslocoTranspiler;
    const getFunctionalTranspiler = functionTranspilerFactory();

    beforeEach(() => {
      transpiler = getFunctionalTranspiler();
    });

    it(`GIVEN a FunctionalTranspiler instance
        WHEN transpiling a value with a function call
        THEN should call the correct transpiler function and return the result`, () => {
      const parsed = transpiler.transpile(
        getTranspilerParams('[[ upperCase(lowercase) ]]'),
      );
      expect(parsed).toEqual('LOWERCASE');
    });

    it(`GIVEN a FunctionalTranspiler instance
        WHEN transpiling a value with multiple function calls
        THEN should process all function calls and return the combined result`, () => {
      const parsed = transpiler.transpile(
        getTranspilerParams(
          'first [[ upperCase(second) ]] third [[ upperCase(fourth) ]] fifth',
        ),
      );
      expect(parsed).toEqual('first SECOND third FOURTH fifth');
    });

    it(`GIVEN a FunctionalTranspiler instance
        WHEN transpiling with function parameters
        THEN should pass the function parameters correctly to the transpiler function`, () => {
      const spy = spyOn(transpilerFunctions['upperCase'], 'transpile');
      transpiler.transpile(getTranspilerParams('[[ upperCase(lowercase) ]]'));
      expect(spy).toHaveBeenCalledWith('lowercase');
      spy.calls.reset();
      transpiler.transpile(
        getTranspilerParams(
          '[[ upperCase(lowercase, another one, many more) ]]',
        ),
      );
      expect(spy as any).toHaveBeenCalledWith(
        'lowercase',
        'another one',
        'many more',
      );
    });

    it(`GIVEN a FunctionalTranspiler instance
        WHEN transpiling with function calls and interpolation parameters
        THEN should combine function results with interpolated parameter values`, () => {
      const parsed = transpiler.transpile(
        getTranspilerParams('[[ testParams(and {{anotherParson}}) ]]', {
          params: { person: 'Shahar', anotherParson: 'Netanel' },
        }),
      );
      expect(parsed).toEqual('Hello Shahar and Netanel');
    });

    it(`GIVEN a FunctionalTranspiler instance with translation keys available
        WHEN transpiling with function calls that reference other translation keys
        THEN should resolve the key references and return the referenced translation`, () => {
      const parsed = transpiler.transpile(
        getTranspilerParams('[[ testKeyReference() ]]', {
          translation: { fromList: 'Hello' },
        }),
      );
      expect(parsed).toEqual('Hello');
    });

    it(`GIVEN a FunctionalTranspiler instance
        WHEN transpiling with a function parameter that includes an escaped comma
        THEN should handle the escaped comma correctly and treat it as part of the parameter value`, () => {
      const parsed = transpiler.transpile(
        getTranspilerParams('[[ returnSecondParam(noop, one\\, two, noop) ]]'),
      );
      expect(parsed).toEqual('one, two');
    });

    describe('getFunctionArgs', () => {
      it(`GIVEN an empty string of raw arguments
          WHEN parsing the function arguments
          THEN should return an empty array`, () => {
        const rawArgs = '';
        expect(getFunctionArgs(rawArgs)).toEqual([]);
      });

      it(`GIVEN a comma-separated string with extra spaces
          WHEN parsing the function arguments
          THEN should split by comma and trim extra spaces from each argument`, () => {
        const rawArgs = ',one,    two, three, ,four and five';
        expect(getFunctionArgs(rawArgs)).toEqual([
          '',
          'one',
          'two',
          'three',
          '',
          'four and five',
        ]);
      });

      it(`GIVEN a string with escaped commas
          WHEN parsing the function arguments
          THEN should handle escaped commas as part of the argument value`, () => {
        const rawArgs = `Hi there\\, how are you?,   I'm ok`;
        expect(getFunctionArgs(rawArgs)).toEqual([
          'Hi there, how are you?',
          `I'm ok`,
        ]);
      });
    });
  });

  function withDefaultBehaviorTests(
    getTranspiler: () => TranslocoTranspiler,
    [start, end]: [string, string] = defaultConfig.interpolation,
  ) {
    function wrapParam(param: string) {
      return `${start} ${param} ${end}`;
    }

    describe('Default Transpiler Behavior', () => {
      let transpiler: TranslocoTranspiler;

      beforeEach(() => {
        transpiler = getTranspiler();
      });

      it(`GIVEN a transpiler instance with interpolation parameters
          WHEN transpiling a string with a single parameter placeholder
          THEN should replace the placeholder with the parameter value`, () => {
        const parsed = transpiler.transpile(
          getTranspilerParams(`Hello ${wrapParam('value')}`, {
            params: { value: 'World' },
          }),
        );
        expect(parsed).toEqual('Hello World');
      });

      it(`GIVEN a transpiler instance with multiple interpolation parameters
          WHEN transpiling a string with multiple parameter placeholders
          THEN should replace all placeholders with their respective parameter values`, () => {
        const parsed = transpiler.transpile(
          getTranspilerParams(
            `Hello ${wrapParam('from')} ${wrapParam('name')}`,
            {
              params: { name: 'Transloco', from: 'from' },
            },
          ),
        );
        expect(parsed).toEqual('Hello from Transloco');
      });

      it(`GIVEN a transpiler instance with translation keys available
          WHEN transpiling a string with a key reference from the translation
          THEN should replace the key reference with the translation value`, () => {
        const parsed = transpiler.transpile(
          getTranspilerParams(`Hello ${wrapParam('world')}`, {
            translation: flatten({ world: 'World' }),
          }),
        );
        expect(parsed).toEqual('Hello World');
      });

      it(`GIVEN a transpiler instance with translation keys including nested values
          WHEN transpiling a string with multiple key references from the translation
          THEN should replace all key references with their translation values including nested ones`, () => {
        const lang = flatten({
          withKeys: 'with keys',
          from: 'from',
          lang: 'lang',
          nes: { ted: 'supporting nested values!' },
        });
        const parsed = transpiler.transpile(
          getTranspilerParams(
            `Hello ${wrapParam('withKeys')} ${wrapParam('from')} ${wrapParam(
              'lang',
            )} ${wrapParam('nes.ted')}`,
            {
              translation: lang,
            },
          ),
        );
        expect(parsed).toEqual(
          'Hello with keys from lang supporting nested values!',
        );
      });

      it(`GIVEN a transpiler instance with translation keys that reference other keys
          WHEN transpiling with nested parameter references
          THEN should recursively resolve all key references with their parameter values`, () => {
        const lang = flatten({
          dear: `dear ${wrapParam('name')}`,
          hello: `Hello ${wrapParam('dear')}`,
        });
        const parsed = transpiler.transpile(
          getTranspilerParams(`${wrapParam('hello')}`, {
            translation: lang,
            params: { name: 'world' },
          }),
        );
        expect(parsed).toEqual('Hello dear world');
      });

      it(`GIVEN a transpiler instance with both parameters and translation keys
          WHEN transpiling a string with a mix of parameter and key references
          THEN should replace parameter references and key references with their respective values`, () => {
        const parsed = transpiler.transpile(
          getTranspilerParams(
            `Hello ${wrapParam('from')} ${wrapParam('name')}`,
            {
              params: { name: 'Transloco' },
              translation: flatten({ from: 'from' }),
            },
          ),
        );
        expect(parsed).toEqual('Hello from Transloco');
      });

      it(`GIVEN a transpiler instance with translation keys and parameters
          WHEN transpiling a string that combines key references with their own parameters and additional parameters
          THEN should resolve the key reference with its parameters and interpolate additional parameters`, () => {
        const lang = flatten({
          hello: `Hello ${wrapParam('name')}`,
        });
        const parsed = transpiler.transpile(
          getTranspilerParams(
            `${wrapParam('hello')}, good ${wrapParam('timeOfDay')}`,
            {
              params: { name: 'world', timeOfDay: 'morning' },
              translation: lang,
            },
          ),
        );
        expect(parsed).toEqual('Hello world, good morning');
      });

      it(`GIVEN a transpiler instance
          WHEN transpiling falsy values (empty string, null, undefined)
          THEN should return the falsy value as-is without modification`, () => {
        expect(transpiler.transpile(getTranspilerParams(''))).toEqual('');
        expect(transpiler.transpile(getTranspilerParams(null))).toEqual(null);
        expect(transpiler.transpile(getTranspilerParams(undefined))).toEqual(
          undefined,
        );
      });

      it(`GIVEN a transpiler instance with nested parameter objects
          WHEN transpiling a string with dot-notation parameter references
          THEN should resolve nested parameter values using dot notation`, () => {
        expect(
          transpiler.transpile(
            getTranspilerParams(
              `From ${wrapParam('range.start')} to ${wrapParam('range.end')}`,
              {
                params: {
                  range: {
                    start: 1,
                    end: 10,
                  },
                },
              },
            ),
          ),
        ).toEqual('From 1 to 10');
      });

      it(`GIVEN a transpiler instance with translation keys that reference other keys
          WHEN transpiling a key that references another key
          THEN should resolve the key reference and return the complete translated value`, () => {
        const lang = flatten({
          ab: `a b ${wrapParam('cd')}`,
          cd: `c d`,
        });
        expect(
          transpiler.transpile(
            getTranspilerParams(lang.ab, {
              translation: lang,
            }),
          ),
        ).toEqual('a b c d');
      });

      it(`GIVEN a transpiler instance with deeply nested key references
          WHEN transpiling keys with multiple levels of key references including parameters
          THEN should recursively resolve all nested key references with their parameters`, () => {
        const lang = flatten({
          ab: `a b ${wrapParam('cd')}`,
          cd: `c d`,
          reallyNested: `${wrapParam('ab')} e`,
          withParams: `Hello ${wrapParam(`a${wrapParam('name')}`)}`,
        });
        expect(
          transpiler.transpile(
            getTranspilerParams(lang.ab, {
              translation: lang,
            }),
          ),
        ).toEqual('a b c d');
        expect(
          transpiler.transpile(
            getTranspilerParams(lang.reallyNested, {
              translation: lang,
            }),
          ),
        ).toEqual('a b c d e');
        expect(
          transpiler.transpile(
            getTranspilerParams(lang.withParams, {
              translation: lang,
              params: { name: 'b' },
            }),
          ),
        ).toEqual('Hello a b c d');
      });

      describe('Objects', () => {
        const translations = {
          a: 'Hello',
          b: {
            flat: `Flat ${wrapParam('dynamic')}`,
            c: {
              otherKey: 'otherKey',
              d: `Hello ${wrapParam('value')}`,
            },
            g: {
              h: `Name ${wrapParam('name')}`,
            },
          },
          i: {
            j: `Hey ${wrapParam('value')}`,
          },
        };

        it(`GIVEN a transpiler instance
            WHEN transpiling an object with nested structure
            THEN should return the object as-is without modification`, () => {
          expect(
            transpiler.transpile(getTranspilerParams(translations.b)),
          ).toEqual(translations.b);
        });

        it(`GIVEN a transpiler instance with nested parameters for object keys
            WHEN transpiling an object with parameter placeholders in nested properties
            THEN should interpolate parameters in all nested levels of the object`, () => {
          expect(
            transpiler.transpile(
              getTranspilerParams(translations.b, {
                params: {
                  'c.d': { value: 'World' },
                  'g.h': { name: 'Transloco' },
                  flat: { dynamic: 'HOLA' },
                },
              }),
            ),
          ).toEqual({
            flat: 'Flat HOLA',
            c: {
              otherKey: 'otherKey',
              d: 'Hello World',
            },
            g: {
              h: 'Name Transloco',
            },
          });

          expect(
            transpiler.transpile(
              getTranspilerParams(translations.i, {
                params: {
                  j: { value: 'Transloco' },
                },
              }),
            ),
          ).toEqual({
            j: 'Hey Transloco',
          });

          expect(
            transpiler.transpile(
              getTranspilerParams(translations.b.c, {
                params: {
                  d: { value: 'Transloco' },
                },
              }),
            ),
          ).toEqual({
            otherKey: 'otherKey',
            d: 'Hello Transloco',
          });
        });
      });

      describe('Arrays', () => {
        const translations = {
          a: ['Hello person', 'Hello world'],
          b: [
            `Hello ${wrapParam('name')}`,
            'Hello world',
            `Hello there ${wrapParam('name')}`,
          ],
          c: [
            `Hello ${wrapParam('one')} ${wrapParam('two')}`,
            wrapParam('three'),
            `Hello there ${wrapParam('one')}`,
          ],
          d: [wrapParam('ref'), 'Hello'],
          e: [
            wrapParam('refWithParam'),
            wrapParam('ref'),
            `transloco ${wrapParam('refWithParam')}`,
          ],
        };

        it(`GIVEN a transpiler instance
            WHEN transpiling an array of strings
            THEN should return the array as-is without modification`, () => {
          expect(
            transpiler.transpile(getTranspilerParams(translations.a)),
          ).toEqual(translations.a);
        });

        it(`GIVEN a transpiler instance with translation keys
            WHEN transpiling an array with key references to other translations
            THEN should resolve all key references in the array elements`, () => {
          const translation = {
            ref: 'Hello world',
            refWithParam: `Hello ${wrapParam('name')}`,
          };
          expect(
            transpiler.transpile(
              getTranspilerParams(translations.d, { translation }),
            ),
          ).toEqual(['Hello world', 'Hello']);

          expect(
            transpiler.transpile(
              getTranspilerParams(translations.e, {
                translation,
                params: { name: 'Transloco' },
              }),
            ),
          ).toEqual([
            'Hello Transloco',
            'Hello world',
            'transloco Hello Transloco',
          ]);
        });

        it(`GIVEN a transpiler instance with parameters
            WHEN transpiling an array with parameter placeholders in elements
            THEN should interpolate parameters in all array elements`, () => {
          expect(
            transpiler.transpile(
              getTranspilerParams(translations.b, {
                params: { name: 'Transloco' },
              }),
            ),
          ).toEqual([
            'Hello Transloco',
            'Hello world',
            'Hello there Transloco',
          ]);

          expect(
            transpiler.transpile(
              getTranspilerParams(translations.c, {
                params: {
                  one: 'Transloco1',
                  two: 'Transloco2',
                  three: 'Transloco3',
                },
              }),
            ),
          ).toEqual([
            'Hello Transloco1 Transloco2',
            'Transloco3',
            'Hello there Transloco1',
          ]);
        });
      });
    });
  }
});
