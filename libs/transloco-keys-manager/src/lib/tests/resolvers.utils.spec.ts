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
  describe('when the scope path is registered', () => {
    it('should return its alias', () => {
      expect(
        resolveScopeAlias({ scopePath: 'some/nested', scopes, langs }),
      ).toBe('someNested');
    });
  });

  describe('when the scope path ends with a configured language', () => {
    it('should strip the language and return the alias', () => {
      expect(
        resolveScopeAlias({ scopePath: 'some/nested/en', scopes, langs }),
      ).toBe('someNested');
    });
  });

  /**
   * Popping the last segment unconditionally used to resolve an unrelated
   * path to its parent scope, attributing the keys to the wrong scope.
   */
  describe('when the last segment is not a configured language', () => {
    it('should not strip it and should return no alias', () => {
      expect(
        resolveScopeAlias({ scopePath: 'some/nested/deep', scopes, langs }),
      ).toBeUndefined();
    });

    it('should not fall back to a parent scope', () => {
      expect(
        resolveScopeAlias({ scopePath: 'some/unregistered', scopes, langs }),
      ).toBeUndefined();
    });
  });
});
