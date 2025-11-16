import { LangResolver } from '../lang-resolver';

describe('LangResolver', () => {
  let resolver: LangResolver;

  beforeEach(() => (resolver = new LangResolver()));

  it(`GIVEN inline lang is provided
      WHEN resolver resolves language
      THEN should return inline lang`, () => {
    expect(
      resolver.resolve({
        inline: 'es',
        provider: undefined,
        active: 'en',
      }),
    ).toEqual('es');
  });

  it(`GIVEN provider lang is provided
      WHEN resolver resolves language
      THEN should return provider lang`, () => {
    expect(
      resolver.resolve({
        inline: undefined,
        provider: 'es',
        active: 'en',
      }),
    ).toEqual('es');
  });

  it(`GIVEN no inline or provider lang
      WHEN resolver resolves language
      THEN should return active lang`, () => {
    expect(
      resolver.resolve({
        inline: undefined,
        provider: undefined,
        active: 'en',
      }),
    ).toEqual('en');
  });

  it(`GIVEN inline lang with static pipe
      WHEN resolver resolves language
      THEN should return lang without static marker`, () => {
    expect(
      resolver.resolve({
        inline: 'es|static',
        provider: undefined,
        active: 'en',
      }),
    ).toEqual('es');
  });

  it(`GIVEN provider lang with static pipe
      WHEN resolver resolves language
      THEN should return lang without static marker`, () => {
    expect(
      resolver.resolve({
        inline: undefined,
        provider: 'es|static',
        active: 'en',
      }),
    ).toEqual('es');
  });

  it(`GIVEN provider lang is resolved
      WHEN resolver is called second time
      THEN should return active lang`, () => {
    expect(
      resolver.resolve({
        inline: undefined,
        provider: 'es',
        active: 'en',
      }),
    ).toEqual('es');

    expect(
      resolver.resolve({
        inline: undefined,
        provider: 'es',
        active: 'en',
      }),
    ).toEqual('en');
  });

  it(`GIVEN inline lang is resolved
      WHEN resolver is called second time
      THEN should return active lang`, () => {
    expect(
      resolver.resolve({
        inline: 'es',
        provider: 'fr',
        active: 'en',
      }),
    ).toEqual('es');

    expect(
      resolver.resolve({
        inline: 'es',
        provider: 'fr',
        active: 'en',
      }),
    ).toEqual('en');
  });

  it(`GIVEN various scope/lang combinations
      WHEN resolving lang from scope
      THEN should extract lang correctly`, () => {
    expect(resolver.resolveLangBasedOnScope('es')).toEqual('es');
    expect(resolver.resolveLangBasedOnScope('todos/es')).toEqual('es');
    expect(resolver.resolveLangBasedOnScope('todos/nested/en')).toEqual('en');
    expect(resolver.resolveLangBasedOnScope('')).toEqual('');
  });

  it(`GIVEN lang and optional scope
      WHEN resolving full lang path
      THEN should construct correct path`, () => {
    expect(resolver.resolveLangPath('en', undefined)).toEqual('en');
    expect(resolver.resolveLangPath('en', 'todos')).toEqual('todos/en');
    expect(resolver.resolveLangPath('es', 'todos/nested')).toEqual(
      'todos/nested/es',
    );
  });
});
