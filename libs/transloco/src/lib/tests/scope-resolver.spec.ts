import { ScopeResolver } from '../scope-resolver';

describe('ScopeResolver', () => {
  let resolver: ScopeResolver;
  let spy: jasmine.Spy<jasmine.Func>;

  beforeEach(() => {
    spy = jasmine.createSpy('setScopeAlias');
    resolver = new ScopeResolver({
      _setScopeAlias: spy,
    } as any);
  });

  it('should return inline scope', () => {
    expect(
      resolver.resolve({
        inline: 'lazy-page',
        provider: 'admin-page',
      })
    ).toEqual('lazy-page');
  });

  it('should return provider scope', () => {
    expect(
      resolver.resolve({
        inline: undefined,
        provider: 'admin-page',
      })
    ).toEqual('admin-page');
  });

  it('should return undefined', () => {
    expect(
      resolver.resolve({
        inline: undefined,
        provider: undefined,
      })
    ).toEqual(undefined);
  });

  it('should return provider scope with object and set the alias', () => {
    expect(
      resolver.resolve({
        inline: undefined,
        provider: {
          scope: 'admin-page',
          alias: 'admin',
        },
      })
    ).toEqual('admin-page');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('admin-page', 'admin');
  });

  it('should return provider scope with object and set the alias as the scope name if not provided', () => {
    expect(
      resolver.resolve({
        inline: undefined,
        provider: {
          scope: 'admin-page',
        },
      })
    ).toEqual('admin-page');
    // one from before
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('admin-page', 'adminPage');
  });

  it('should return provider scope with object and set the alias as the scope name if not provided', () => {
    expect(
      resolver.resolve({
        inline: undefined,
        provider: {
          scope: 'nested/scopes/admin-page',
        },
      })
    ).toEqual('nested/scopes/admin-page');
    // one from before
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('nested/scopes/admin-page', 'nestedScopesAdminPage');
  });
});
