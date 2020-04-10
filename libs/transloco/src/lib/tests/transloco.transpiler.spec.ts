import { DefaultTranspiler } from '../transloco.transpiler';
import { flatten } from '../helpers';

describe('TranslocoTranspiler', () => {
  const parser = new DefaultTranspiler();

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

  it('should translate simple string with params and from lang', () => {
    const parsed = parser.transpile('Hello {{ from }} {{ name }}', { name: 'Transloco' }, flatten({ from: 'from' }));
    expect(parsed).toEqual('Hello from Transloco');
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
});
