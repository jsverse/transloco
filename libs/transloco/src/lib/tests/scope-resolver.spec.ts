import { ScopeResolver } from '../scope-resolver';

describe('ScopeResolver', () => {
  let resolver: ScopeResolver;
  let spy: jasmine.Spy<jasmine.Func>;

  beforeEach(() => {
    spy = jasmine.createSpy('setScopeAlias');
    resolver = new ScopeResolver({
      _setScopeAlias: spy,
      config: {
        scopes: {
          keepCasing: false,
        },
      },
    } as any);
  });

  it(`GIVEN inline scope is provided
      WHEN resolver resolves scope
      THEN should return inline scope`, () => {
    expect(
      resolver.resolve({
        inline: 'lazy-page',
        provider: 'admin-page',
      }),
    ).toEqual('lazy-page');
  });

  it(`GIVEN provider scope is provided
      WHEN resolver resolves scope
      THEN should return provider scope`, () => {
    expect(
      resolver.resolve({
        inline: undefined,
        provider: 'admin-page',
      }),
    ).toEqual('admin-page');
  });

  it(`GIVEN no scope is provided
      WHEN resolver resolves scope
      THEN should return undefined`, () => {
    expect(
      resolver.resolve({
        inline: undefined,
        provider: undefined,
      }),
    ).toEqual(undefined);
  });

  it(`GIVEN provider scope with object and alias
      WHEN resolver resolves scope
      THEN should return scope and set the alias`, () => {
    expect(
      resolver.resolve({
        inline: undefined,
        provider: {
          scope: 'admin-page',
          alias: 'admin',
        },
      }),
    ).toEqual('admin-page');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('admin-page', 'admin');
  });

  it(`GIVEN provider scope without explicit alias
      WHEN resolver resolves scope
      THEN should use camelCased scope name as alias`, () => {
    expect(
      resolver.resolve({
        inline: undefined,
        provider: {
          scope: 'admin-page',
        },
      }),
    ).toEqual('admin-page');
    // one from before
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('admin-page', 'adminPage');
  });

  it(`GIVEN nested provider scope without explicit alias
      WHEN resolver resolves scope
      THEN should use camelCased full scope path as alias`, () => {
    expect(
      resolver.resolve({
        inline: undefined,
        provider: {
          scope: 'nested/scopes/admin-page',
        },
      }),
    ).toEqual('nested/scopes/admin-page');
    // one from before
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      'nested/scopes/admin-page',
      'nestedScopesAdminPage',
    );
  });

  it(`GIVEN keepCasing config is true
      WHEN resolver resolves scope
      THEN should keep original scope name casing`, () => {
    resolver = new ScopeResolver({
      _setScopeAlias: spy,
      config: { scopes: { keepCasing: true } },
    } as any);

    expect(
      resolver.resolve({
        inline: undefined,
        provider: { scope: 'AdMiN-pAgE' },
      }),
    ).toEqual('AdMiN-pAgE');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('AdMiN-pAgE', 'AdMiN-pAgE');
  });
});
