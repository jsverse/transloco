import { describe, expect, it } from 'vitest';

import { resolveScopeAlias } from '../keys-builder/utils/resolvers.utils';
import { Scopes } from '../types';

const scopes: Scopes = {
  scopeToAlias: {
    'some/nested': 'someNested',
    some: 'some',
  },
  aliasToScope: {
    someNested: 'some/nested',
    some: 'some',
  },
};

const langs = ['en', 'es'];

describe('resolveScopeAlias', () => {
  it('given a registered scope path, when resolved, then it should return its alias', () => {
    const scopePath = 'some/nested';

    const result = resolveScopeAlias({ scopePath, scopes, langs });

    expect(result).toBe('someNested');
  });

  it('given a scope path ending with a configured language, when resolved, then the language should be stripped', () => {
    const scopePath = 'some/nested/en';

    const result = resolveScopeAlias({ scopePath, scopes, langs });

    expect(result).toBe('someNested');
  });

  /**
   * Popping the last segment unconditionally used to resolve an unrelated
   * path to its parent scope, attributing the keys to the wrong scope.
   */
  it('given a trailing segment that is not a configured language, when resolved, then it should return no alias', () => {
    const scopePath = 'some/nested/deep';

    const result = resolveScopeAlias({ scopePath, scopes, langs });

    expect(result).toBeUndefined();
  });

  it('given an unregistered scope path, when resolved, then it should not fall back to a parent scope', () => {
    const scopePath = 'some/unregistered';

    const result = resolveScopeAlias({ scopePath, scopes, langs });

    expect(result).toBeUndefined();
  });
});
