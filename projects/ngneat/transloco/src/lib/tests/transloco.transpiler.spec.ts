import { DefaultTranspiler, FunctionalTranspiler, getFunctionArgs, TranslocoTranspiler } from '../transloco.transpiler';
import { flatten } from '../helpers';
import { transpilerFunctions } from './transloco.mocks';

describe('TranslocoTranspiler', () => {
  describe('DefaultTranspiler', () => {
    testDefaultBehaviour(new DefaultTranspiler());
  });

  describe('FunctionalTranspiler', () => {
    const injectorMock = { get: key => transpilerFunctions[key] };
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
      parser.transpile('[[ upperCase(lowercase, another one, many more) ]]', {}, {});
      expect(spy).toHaveBeenCalledWith('lowercase', 'another one', 'many more');
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
      const parsed = parser.transpile('[[ testKeyReference() ]]', {}, { fromList: 'Hello' });
      expect(parsed).toEqual('Hello');
    });

    it('should handle a param that includes a comma', () => {
      const parsed = parser.transpile('[[ returnSecondParam(noop, one\\, two, noop) ]]', {}, {});
      expect(parsed).toEqual('one, two');
    });

    describe('getFunctionArgs', () => {
      it('should return an empty array', () => {
        const rawArgs = '';
        expect(getFunctionArgs(rawArgs)).toEqual([]);
      });

      it('should split the string by a comma and remove extra spaces', () => {
        const rawArgs = ',one,    two, three, ,four and five';
        expect(getFunctionArgs(rawArgs)).toEqual(['', 'one', 'two', 'three', '', 'four and five']);
      });

      it('should handle an escaped comma', () => {
        const rawArgs = `Hi there\\, how are you?,   I'm ok`;
        expect(getFunctionArgs(rawArgs)).toEqual(['Hi there, how are you?', `I'm ok`]);
      });
    });
  });

  function testDefaultBehaviour(parser: TranslocoTranspiler) {
    it('should translate simple string from params', () => {
      const parsed = parser.transpile('Hello {{ value }}', { value: 'World' }, {});
      expect(parsed).toEqual('Hello World');
    });

    it('should translate simple string with multiple params', () => {
      const parsed = parser.transpile('Hello {{ from }} {{ name }}', { name: 'Transloco', from: 'from' }, {});
      expect(parsed).toEqual('Hello from Transloco');
    });

    it('should translate simple string with a key from lang', () => {
      const parsed = parser.transpile('Hello {{ world }}', {}, flatten({ world: 'World' }));
      expect(parsed).toEqual('Hello World');
    });

    it('should translate simple string multiple keys from lang', () => {
      const lang = flatten({
        withKeys: 'with keys',
        from: 'from',
        lang: 'lang',
        nes: { ted: 'supporting nested values!' }
      });
      const parsed = parser.transpile('Hello {{ withKeys }} {{ from }} {{ lang }} {{nes.ted}}', {}, lang);
      expect(parsed).toEqual('Hello with keys from lang supporting nested values!');
    });

    it('should translate simple string with from lang with nested params', () => {
      const lang = flatten({
        dear: 'dear {{name}}',
        hello: 'Hello {{dear}}'
      });
      const parsed = parser.transpile('{{ hello }}', { name: 'world' }, lang);
      expect(parsed).toEqual('Hello dear world');
    });

    it('should translate simple string with params and from lang', () => {
      const parsed = parser.transpile('Hello {{ from }} {{ name }}', { name: 'Transloco' }, flatten({ from: 'from' }));
      expect(parsed).toEqual('Hello from Transloco');
    });

    it('should translate simple string with params and from lang with params', () => {
      const lang = flatten({
        hello: 'Hello {{name}}'
      });
      const parsed = parser.transpile(
        '{{ hello }}, good {{ timeOfDay }}',
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
      const translation = {
        a: 'Hello',
        j: {
          r: 'Hey {{value}}'
        },
        b: {
          flat: 'Flat {{ dynamic }}',
          c: {
            otherKey: 'otherKey',
            d: 'Hello {{value}}'
          },
          g: {
            h: 'Name {{ name }}'
          }
        }
      };

      it('should support objects', () => {
        expect(parser.transpile(translation.b, null, {})).toEqual(translation.b);
      });

      it('should support params', () => {
        expect(
          parser.transpile(
            translation.b,
            {
              'c.d': { value: 'World' },
              'g.h': { name: 'Transloco' },
              flat: { dynamic: 'HOLA' }
            },
            {}
          )
        ).toEqual({
          flat: 'Flat HOLA',
          c: {
            otherKey: 'otherKey',
            d: 'Hello World'
          },
          g: {
            h: 'Name Transloco'
          }
        });

        expect(
          parser.transpile(
            translation.j,
            {
              r: { value: 'Transloco' }
            },
            {}
          )
        ).toEqual({
          r: 'Hey Transloco'
        });

        expect(
          parser.transpile(
            translation.b.c,
            {
              d: { value: 'Transloco' }
            },
            {}
          )
        ).toEqual({
          otherKey: 'otherKey',
          d: 'Hello Transloco'
        });
      });
    });
  }
});
