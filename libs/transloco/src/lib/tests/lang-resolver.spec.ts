import { LangResolver } from '../lang-resolver';

describe('LangResolver', () => {
  let resolver: LangResolver;

  beforeEach(() => (resolver = new LangResolver()));

  it('should return inline lang', () => {
    expect(
      resolver.resolve({
        inline: 'es',
        provider: undefined,
        active: 'en',
      })
    ).toEqual('es');
  });

  it('should return provider lang', () => {
    expect(
      resolver.resolve({
        inline: undefined,
        provider: 'es',
        active: 'en',
      })
    ).toEqual('es');
  });

  it('should return active lang', () => {
    expect(
      resolver.resolve({
        inline: undefined,
        provider: undefined,
        active: 'en',
      })
    ).toEqual('en');
  });

  it('should support static pipe - inline', () => {
    expect(
      resolver.resolve({
        inline: 'es|static',
        provider: undefined,
        active: 'en',
      })
    ).toEqual('es');
  });

  it('should support static pipe - provider', () => {
    expect(
      resolver.resolve({
        inline: undefined,
        provider: 'es|static',
        active: 'en',
      })
    ).toEqual('es');
  });

  it('should always return the active lang on the second time - provider', () => {
    expect(
      resolver.resolve({
        inline: undefined,
        provider: 'es',
        active: 'en',
      })
    ).toEqual('es');

    expect(
      resolver.resolve({
        inline: undefined,
        provider: 'es',
        active: 'en',
      })
    ).toEqual('en');
  });

  it('should always return the active lang on the second time - inline', () => {
    expect(
      resolver.resolve({
        inline: 'es',
        provider: 'fr',
        active: 'en',
      })
    ).toEqual('es');

    expect(
      resolver.resolve({
        inline: 'es',
        provider: 'fr',
        active: 'en',
      })
    ).toEqual('en');
  });

  it('should resolve the lang based on the scope', () => {
    expect(resolver.resolveLangBasedOnScope('es')).toEqual('es');
    expect(resolver.resolveLangBasedOnScope('todos/es')).toEqual('es');
    expect(resolver.resolveLangBasedOnScope('todos/nested/en')).toEqual('en');
    expect(resolver.resolveLangBasedOnScope('')).toEqual('');
  });

  it('should resolve full lang', () => {
    expect(resolver.resolveLangPath('en', undefined)).toEqual('en');
    expect(resolver.resolveLangPath('en', 'todos')).toEqual('todos/en');
    expect(resolver.resolveLangPath('es', 'todos/nested')).toEqual(
      'todos/nested/es'
    );
  });
});
