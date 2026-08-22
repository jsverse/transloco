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
  });

  it('given several scopes, when added, then every pair should be kept', () => {
    addScope('admin/dashboard', 'dashboard');
    addScope('admin/reports', 'reports');

    expect(getScopes()).toEqual({
      scopeToAlias: {
        'admin/dashboard': 'dashboard',
        'admin/reports': 'reports',
      },
      aliasToScope: {
        dashboard: 'admin/dashboard',
        reports: 'admin/reports',
      },
    });
  });

  it('given a registered scope, when checked, then hasScope should reflect it', () => {
    addScope('admin/dashboard', 'dashboard');

    expect(hasScope('admin/dashboard')).toBe(true);
    expect(hasScope('admin/reports')).toBe(false);
  });

  it('given registered scopes, when reset, then both maps should be emptied', () => {
    addScope('admin/dashboard', 'dashboard');
    resetScopes();

    expect(getScopes()).toEqual({ scopeToAlias: {}, aliasToScope: {} });
    expect(hasScope('admin/dashboard')).toBe(false);
  });
});
