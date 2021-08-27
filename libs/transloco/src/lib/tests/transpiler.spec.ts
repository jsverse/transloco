import {
  DefaultTranspiler,
  FunctionalTranspiler,
  getFunctionArgs,
  TranslocoTranspiler,
} from '../transloco.transpiler';
import { flatten } from '../helpers';
import { transpilerFunctions } from './mocks';
import { defaultConfig, translocoConfig } from '../transloco.config';
import { Injector } from '@angular/core';

describe('TranslocoTranspiler', () => {
  describe('DefaultTranspiler', () => {
    testDefaultBehaviour(new DefaultTranspiler());
  });

  describe('DefaultTranspiler with custom interpolation', () => {
    testDefaultBehaviour(
      new DefaultTranspiler(translocoConfig({ interpolation: ['<<', '>>'] })),
      ['<<', '>>']
    );
  });

  describe('FunctionalTranspiler', () => {
    const injectorMock = {
      get: (key: keyof typeof transpilerFunctions) => transpilerFunctions[key],
    } as Injector;
    const parser = new FunctionalTranspiler(injectorMock);
    testDefaultBehaviour(parser);

    it('should call the correct function', () => {
      const parsed = parser.transpile('[[ upperCase(lowercase) ]]', {}, {});
      expect(parsed).toEqual('LOWERCASE');
    });

    it('should pass the function params', () => {
      const spy = spyOn(transpilerFunctions['upperCase'], 'transpile');
      parser.transpile('[[ upperCase(lowercase) ]]', {}, {});
      expect(spy).toHaveBeenCalledWith('lowercase');
      spy.calls.reset();
      parser.transpile(
        '[[ upperCase(lowercase, another one, many more) ]]',
        {},
        {}
      );
      expect(spy as any).toHaveBeenCalledWith(
        'lowercase',
        'another one',
        'many more'
      );
    });

    it('should work with interpolation params', () => {
      const parsed = parser.transpile(
        '[[ testParams(and {{anotherParson}}) ]]',
        { person: 'Shahar', anotherParson: 'Netanel' },
        {}
      );
      expect(parsed).toEqual('Hello Shahar and Netanel');
    });

    it('should work with keys reference', () => {
      const parsed = parser.transpile(
        '[[ testKeyReference() ]]',
        {},
        { fromList: 'Hello' }
      );
      expect(parsed).toEqual('Hello');
    });

    it('should handle a param that includes a comma', () => {
      const parsed = parser.transpile(
        '[[ returnSecondParam(noop, one\\, two, noop) ]]',
        {},
        {}
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

  function testDefaultBehaviour(
    parser: TranslocoTranspiler,
    [start, end]: [string, string] = defaultConfig.interpolation
  ) {
    function wrapParam(param: string) {
      return `${start} ${param} ${end}`;
    }

    it('should translate simple string from params', () => {
      const parsed = parser.transpile(
        `Hello ${wrapParam('value')}`,
        { value: 'World' },
        {}
      );
      expect(parsed).toEqual('Hello World');
    });

    it('should translate simple string with multiple params', () => {
      const parsed = parser.transpile(
        `Hello ${wrapParam('from')} ${wrapParam('name')}`,
        { name: 'Transloco', from: 'from' },
        {}
      );
      expect(parsed).toEqual('Hello from Transloco');
    });

    it('should translate simple string with a key from lang', () => {
      const parsed = parser.transpile(
        `Hello ${wrapParam('world')}`,
        {},
        flatten({ world: 'World' })
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
      const parsed = parser.transpile(
        `Hello ${wrapParam('withKeys')} ${wrapParam('from')} ${wrapParam(
          'lang'
        )} ${wrapParam('nes.ted')}`,
        {},
        lang
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
      const parsed = parser.transpile(
        `${wrapParam('hello')}`,
        { name: 'world' },
        lang
      );
      expect(parsed).toEqual('Hello dear world');
    });

    it('should translate simple string with params and from lang', () => {
      const parsed = parser.transpile(
        `Hello ${wrapParam('from')} ${wrapParam('name')}`,
        { name: 'Transloco' },
        flatten({ from: 'from' })
      );
      expect(parsed).toEqual('Hello from Transloco');
    });

    it('should translate simple string with params and from lang with params', () => {
      const lang = flatten({
        hello: `Hello ${wrapParam('name')}`,
      });
      const parsed = parser.transpile(
        `${wrapParam('hello')}, good ${wrapParam('timeOfDay')}`,
        { name: 'world', timeOfDay: 'morning' },
        lang
      );
      expect(parsed).toEqual('Hello world, good morning');
    });

    it('should return the given value when the value is falsy', () => {
      expect(parser.transpile('', {}, {})).toEqual('');
      expect(parser.transpile(null, {}, {})).toEqual(null);
      expect(parser.transpile(undefined, {}, {})).toEqual(undefined);
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
        expect(parser.transpile(translations.b, {}, {})).toEqual(
          translations.b
        );
      });

      it('should support params', () => {
        expect(
          parser.transpile(
            translations.b,
            {
              'c.d': { value: 'World' },
              'g.h': { name: 'Transloco' },
              flat: { dynamic: 'HOLA' },
            },
            {}
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
          parser.transpile(
            translations.i,
            {
              j: { value: 'Transloco' },
            },
            {}
          )
        ).toEqual({
          j: 'Hey Transloco',
        });

        expect(
          parser.transpile(
            translations.b.c,
            {
              d: { value: 'Transloco' },
            },
            {}
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
        expect(parser.transpile(translations.a, {}, {})).toEqual(
          translations.a
        );
      });

      it('should support keys referencing', () => {
        const translation = {
          ref: 'Hello world',
          refWithParam: `Hello ${wrapParam('name')}`,
        };
        expect(parser.transpile(translations.d, {}, translation)).toEqual([
          'Hello world',
          'Hello',
        ]);

        expect(
          parser.transpile(translations.e, { name: 'Transloco' }, translation)
        ).toEqual([
          'Hello Transloco',
          'Hello world',
          'transloco Hello Transloco',
        ]);
      });

      it('should support params', () => {
        expect(
          parser.transpile(translations.b, { name: 'Transloco' }, {})
        ).toEqual(['Hello Transloco', 'Hello world', 'Hello there Transloco']);

        expect(
          parser.transpile(
            translations.c,
            {
              one: 'Transloco1',
              two: 'Transloco2',
              three: 'Transloco3',
            },
            {}
          )
        ).toEqual([
          'Hello Transloco1 Transloco2',
          'Transloco3',
          'Hello there Transloco1',
        ]);
      });
    });
  }
});
