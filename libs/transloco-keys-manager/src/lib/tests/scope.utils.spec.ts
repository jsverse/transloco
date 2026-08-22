import { beforeEach, describe, expect, it } from 'vitest';

import {
  addScope,
  getScopes,
  hasScope,
  resetScopes,
} from '../keys-builder/utils/scope.utils';

describe('scope.utils', () => {
  beforeEach(() => resetScopes());

  it('given a scope and an alias, when added, then both directions should map', () => {
    addScope('admin/dashboard', 'dashboard');

    expect(getScopes()).toEqual({
      scopeToAlias: { 'admin/dashboard': 'dashboard' },
      aliasToScope: { dashboard: 'admin/dashboard' },
    });
    expect(hasScope('admin/dashboard')).toBe(true);
  });

  it('given an existing scope, when it is re-aliased, then the stale alias should be removed', () => {
    addScope('admin/dashboard', 'oldAlias');
    addScope('admin/dashboard', 'newAlias');

    expect(getScopes()).toEqual({
      scopeToAlias: { 'admin/dashboard': 'newAlias' },
      aliasToScope: { newAlias: 'admin/dashboard' },
    });
  });

  it('given an alias already in use, when another scope claims it, then the stale scope should be removed', () => {
    addScope('admin/dashboard', 'shared');
    addScope('admin/reports', 'shared');

    expect(getScopes()).toEqual({
      scopeToAlias: { 'admin/reports': 'shared' },
      aliasToScope: { shared: 'admin/reports' },
    });
    expect(hasScope('admin/dashboard')).toBe(false);
  });
});
