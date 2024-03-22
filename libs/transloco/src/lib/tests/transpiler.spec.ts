import {Injector} from '@angular/core';
import {TestBed} from '@angular/core/testing';

import {
  DefaultTranspiler,
  FunctionalTranspiler,
  getFunctionArgs,
  TRANSLOCO_TRANSPILER,
  TranslocoTranspiler,
  TranspileParams,
} from '../transloco.transpiler';
import {flatten} from '../helpers';
import {defaultConfig, TranslocoConfig, translocoConfig} from '../transloco.config';
import {provideTransloco, provideTranslocoTranspiler} from '../transloco.providers';

import {transpilerFunctions} from './mocks';

const injectorMock = {
  get: (key: keyof typeof transpilerFunctions) => transpilerFunctions[key],
};

function getTranspilerParams(value: unknown, overrides?: Partial<Omit<TranspileParams, 'value'>>): TranspileParams {
  return {
    value,
    key: 'key',
    translation: {},
    ...overrides
  }
}

function transpilerFactory(config: TranslocoConfig = defaultConfig) {
  return function getTranspiler() {
    return TestBed.configureTestingModule({
      providers: [
        provideTransloco({config})
      ],
    }).inject(TRANSLOCO_TRANSPILER);
  };
}

function functionTranspilerFactory() {
  return function getFunctionalTranspiler() {
    return TestBed.configureTestingModule({
      providers: [
        {provide: Injector, useValue: injectorMock},
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
      transpilerFactory(translocoConfig({interpolation})),
      interpolation
    );
  });

  describe('FunctionalTranspiler', () => {
    withDefaultBehaviorTests(functionTranspilerFactory());
  })

  describe('FunctionalTranspiler', () => {
    let transpiler: TranslocoTranspiler;
    const getFunctionalTranspiler = functionTranspilerFactory();
    
    beforeEach(() => {
      transpiler = getFunctionalTranspiler();
    });

    it('should call the correct function', () => {
      const parsed = transpiler.transpile(getTranspilerParams('[[ upperCase(lowercase) ]]'));
      expect(parsed).toEqual('LOWERCASE');
    });

    it('should work with multiple functions', () => {
      const parsed = transpiler.transpile(
        getTranspilerParams('first [[ upperCase(second) ]] third [[ upperCase(fourth) ]] fifth')
      );
      expect(parsed).toEqual('first SECOND third FOURTH fifth');
    });

    it('should pass the function params', () => {
      const spy = spyOn(transpilerFunctions['upperCase'], 'transpile');
      transpiler.transpile(
        getTranspilerParams('[[ upperCase(lowercase) ]]')
      );
      expect(spy).toHaveBeenCalledWith('lowercase');
      spy.calls.reset();
      transpiler.transpile(
        getTranspilerParams('[[ upperCase(lowercase, another one, many more) ]]')
      );
      expect(spy as any).toHaveBeenCalledWith(
        'lowercase',
        'another one',
        'many more'
      );
    });

    it('should work with interpolation params', () => {
      const parsed = transpiler.transpile(
        getTranspilerParams('[[ testParams(and {{anotherParson}}) ]]', {
          params: {person: 'Shahar', anotherParson: 'Netanel'}
        })
      );
      expect(parsed).toEqual('Hello Shahar and Netanel');
    });

    it('should work with keys reference', () => {
      const parsed = transpiler.transpile(getTranspilerParams('[[ testKeyReference() ]]', {
        translation: {fromList: 'Hello'},
      }));
      expect(parsed).toEqual('Hello');
    });

    it('should handle a param that includes a comma', () => {
      const parsed = transpiler.transpile(
        getTranspilerParams('[[ returnSecondParam(noop, one\\, two, noop) ]]')
      );
      expect(parsed).toEqual('one, two');
    });

    describe('getFunctionArgs', () => {
      it('should return an empty array', () => {
        const rawArgs = '';
        expect(getFunctionArgs(rawArgs)).toEqual([]);
      });

      it('should split the string by a comma and remove extra spaces', () => {
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

      it('should handle an escaped comma', () => {
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
    [start, end]: [string, string] = defaultConfig.interpolation
  ) {
    function wrapParam(param: string) {
      return `${start} ${param} ${end}`;
    }

    describe('Default Transpiler Behavior', () => {
      let transpiler: TranslocoTranspiler;

      beforeEach(() => {
        transpiler = getTranspiler();
      });

      it('should translate simple string from params', () => {
        const parsed = transpiler.transpile(
          getTranspilerParams(`Hello ${wrapParam('value')}`,
            {
              params: {value: 'World'},
            }));
        expect(parsed).toEqual('Hello World');
      });

      it('should translate simple string with multiple params', () => {
        const parsed = transpiler.transpile(
          getTranspilerParams(
            `Hello ${wrapParam('from')} ${wrapParam('name')}`,
            {
              params: {name: 'Transloco', from: 'from'},
            }
          )
        );
        expect(parsed).toEqual('Hello from Transloco');
      });

      it('should translate simple string with a key from lang', () => {
        const parsed = transpiler.transpile(
          getTranspilerParams(`Hello ${wrapParam('world')}`, {
            translation: flatten({world: 'World'})
          })
        );
        expect(parsed).toEqual('Hello World');
      });

      it('should translate simple string multiple keys from lang', () => {
        const lang = flatten({
          withKeys: 'with keys',
          from: 'from',
          lang: 'lang',
          nes: {ted: 'supporting nested values!'},
        });
        const parsed = transpiler.transpile(
          getTranspilerParams(`Hello ${wrapParam('withKeys')} ${wrapParam('from')} ${wrapParam(
            'lang'
          )} ${wrapParam('nes.ted')}`, {
            translation: lang,
          })
        );
        expect(parsed).toEqual(
          'Hello with keys from lang supporting nested values!'
        );
      });

      it('should translate simple string with from lang with nested params', () => {
        const lang = flatten({
          dear: `dear ${wrapParam('name')}`,
          hello: `Hello ${wrapParam('dear')}`,
        });
        const parsed = transpiler.transpile(
          getTranspilerParams(`${wrapParam('hello')}`, {
            translation: lang,
            params: {name: 'world'},
          })
        );
        expect(parsed).toEqual('Hello dear world');
      });

      it('should translate simple string with params and from lang', () => {
        const parsed = transpiler.transpile(
          getTranspilerParams(`Hello ${wrapParam('from')} ${wrapParam('name')}`,
            {
              params: {name: 'Transloco'},
              translation: flatten({from: 'from'})
            })
        );
        expect(parsed).toEqual('Hello from Transloco');
      });

      it('should translate simple string with params and from lang with params', () => {
        const lang = flatten({
          hello: `Hello ${wrapParam('name')}`,
        });
        const parsed = transpiler.transpile(
          getTranspilerParams(`${wrapParam('hello')}, good ${wrapParam('timeOfDay')}`,
            {
              params: {name: 'world', timeOfDay: 'morning'},
              translation: lang,
            })
        );
        expect(parsed).toEqual('Hello world, good morning');
      });

      it('should return the given value when the value is falsy', () => {
        expect(transpiler.transpile(getTranspilerParams(''))).toEqual('');
        expect(transpiler.transpile(getTranspilerParams(null))).toEqual(null);
        expect(transpiler.transpile(getTranspilerParams(undefined))).toEqual(
          undefined
        );
      });

      it('should support key referencing', () => {
        const lang = flatten({
          ab: `a b ${wrapParam('cd')}`,
          cd: `c d`,
        });
        expect(transpiler.transpile(
          getTranspilerParams(lang.ab, {
            translation: lang,
          })
        )).toEqual('a b c d');
      });

      it('should support nested key referencing', () => {
        const lang = flatten({
          ab: `a b ${wrapParam('cd')}`,
          cd: `c d`,
          reallyNested: `${wrapParam('ab')} e`,
          withParams: `Hello ${wrapParam(`a${wrapParam('name')}`)}`,
        });
        expect(transpiler.transpile(
          getTranspilerParams(lang.ab, {
            translation: lang,
          })
        )).toEqual('a b c d');
        expect(transpiler.transpile(
          getTranspilerParams(lang.reallyNested, {
            translation: lang,
          })
        )).toEqual('a b c d e');
        expect(transpiler.transpile(
          getTranspilerParams(lang.withParams, {
            translation: lang,
            params: {name: 'b'}
          })
        )).toEqual('Hello a b c d');
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

        it('should support objects', () => {
          expect(transpiler.transpile(
            getTranspilerParams(translations.b)
          )).toEqual(translations.b);
        });

        it('should support params', () => {
          expect(
            transpiler.transpile(
              getTranspilerParams(translations.b, {
                params: {
                  'c.d': {value: 'World'},
                  'g.h': {name: 'Transloco'},
                  flat: {dynamic: 'HOLA'},
                }
              })
            )
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
                  j: {value: 'Transloco'},
                }
              })
            )
          ).toEqual({
            j: 'Hey Transloco',
          });

          expect(
            transpiler.transpile(
              getTranspilerParams(translations.b.c, {
                params: {
                  d: {value: 'Transloco'},
                }
              })
            )
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

        it('should work with arrays', () => {
          expect(transpiler.transpile(getTranspilerParams(translations.a))).toEqual(
            translations.a
          );
        });

        it('should support keys referencing', () => {
          const translation = {
            ref: 'Hello world',
            refWithParam: `Hello ${wrapParam('name')}`,
          };
          expect(
            transpiler.transpile(getTranspilerParams(translations.d, {translation}))
          ).toEqual(['Hello world', 'Hello']);

          expect(
            transpiler.transpile(
              getTranspilerParams(translations.e, {translation, params: {name: 'Transloco'}})
            )
          ).toEqual([
            'Hello Transloco',
            'Hello world',
            'transloco Hello Transloco',
          ]);
        });

        it('should support params', () => {
          expect(
            transpiler.transpile(
              getTranspilerParams(translations.b, {params: {name: 'Transloco'}})
            )
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
              })
            )
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
