import { DefaultParser } from '../../public-api';

describe('TranslocoParser', () => {
  const parser = new DefaultParser();

  it('should translate simple string from params', () => {
    const parsed = parser.transpile('Hello {{ value }}', { value: 'World' }, {});
    expect(parsed).toEqual('Hello World');
  });

  it('should translate simple string with multiple params', () => {
    const parsed = parser.transpile('Hello {{ from }} {{ name }}', { name: 'Transloco', from: 'from' }, {});
    expect(parsed).toEqual('Hello from Transloco');
  });

  it('should translate simple string with a key from lang', () => {
    const parsed = parser.transpile('Hello {{ world }}', {}, { world: 'World' });
    expect(parsed).toEqual('Hello World');
  });

  it('should translate simple string multiple keys from lang', () => {
    const lang = { withKeys: 'with keys', from: 'from', lang: 'lang', nes: {ted: 'supporting nested values!'} };
    const parsed = parser.transpile('Hello {{ withKeys }} {{ from }} {{ lang }} {{nes.ted}}', {}, lang);
    expect(parsed).toEqual('Hello with keys from lang supporting nested values!');
  });

  it('should translate simple string with params and from lang', () => {
    const parsed = parser.transpile('Hello {{ from }} {{ name }}', { name: 'Transloco' }, { from: 'from' });
    expect(parsed).toEqual('Hello from Transloco');
  });

  it('should return the given value when the value is falsy', () => {
    expect(parser.transpile('', {}, {})).toEqual('');
    expect(parser.transpile(null, {}, {})).toEqual(null);
    expect(parser.transpile(undefined, {}, {})).toEqual(undefined);
  });
});
