import { describe, it, expect, beforeEach, vi } from 'vitest';

import { buildScopeFilePaths } from '../utils/path.utils';
import type { Config, Scopes } from '../types';

let mockConfig: Partial<Config> = {};

vi.mock('../config', () => ({
  getConfig: () => mockConfig,
  setConfig: vi.fn(),
}));

describe('buildScopeFilePaths', () => {
  const aliasToScope: Scopes['aliasToScope'] = {
    admin: 'admin',
    user: 'user',
  };

  const baseParams = {
    aliasToScope,
    output: '/project/src/assets/i18n',
    langs: ['en', 'fr'],
    fileFormat: 'json' as const,
  };

  beforeEach(() => {
    // Reset mock config before each test
    mockConfig = {
      scopePathMap: {},
      __sourceRoot: '',
    };
  });

  it('should build scope file paths without scopePathMap', () => {
    const result = buildScopeFilePaths(baseParams);

    expect(result).toEqual([
      {
        path: '/project/src/assets/i18n/admin/en.json',
        scope: 'admin',
      },
      {
        path: '/project/src/assets/i18n/admin/fr.json',
        scope: 'admin',
      },
      {
        path: '/project/src/assets/i18n/user/en.json',
        scope: 'user',
      },
      {
        path: '/project/src/assets/i18n/user/fr.json',
        scope: 'user',
      },
    ]);
  });

  it('should use scopePathMap when provided', () => {
    mockConfig = {
      scopePathMap: {
        admin: '/project/custom/admin-translations',
      },
      __sourceRoot: '',
    };

    const result = buildScopeFilePaths(baseParams);

    expect(result).toEqual([
      {
        path: '/project/custom/admin-translations/en.json',
        scope: 'admin',
      },
      {
        path: '/project/custom/admin-translations/fr.json',
        scope: 'admin',
      },
      {
        path: '/project/src/assets/i18n/user/en.json',
        scope: 'user',
      },
      {
        path: '/project/src/assets/i18n/user/fr.json',
        scope: 'user',
      },
    ]);
  });

  describe('${sourceRoot} interpolation in scopePathMap', () => {
    it('should interpolate ${sourceRoot} in scopePathMap values', () => {
      mockConfig = {
        scopePathMap: {
          admin: '${sourceRoot}/public/i18n/admin',
        },
        __sourceRoot: 'apps/my-app/src',
      };

      const result = buildScopeFilePaths(baseParams);

      expect(result).toEqual([
        {
          path: 'apps/my-app/src/public/i18n/admin/en.json',
          scope: 'admin',
        },
        {
          path: 'apps/my-app/src/public/i18n/admin/fr.json',
          scope: 'admin',
        },
        {
          path: '/project/src/assets/i18n/user/en.json',
          scope: 'user',
        },
        {
          path: '/project/src/assets/i18n/user/fr.json',
          scope: 'user',
        },
      ]);
    });

    it('should interpolate ${sourceRoot} with relative paths', () => {
      mockConfig = {
        scopePathMap: {
          admin: '${sourceRoot}/../public/i18n/admin',
          user: '${sourceRoot}/../public/i18n/user',
        },
        __sourceRoot: 'libs/my-lib/src',
      };

      const result = buildScopeFilePaths(baseParams);

      expect(result).toEqual([
        {
          path: 'libs/my-lib/src/../public/i18n/admin/en.json',
          scope: 'admin',
        },
        {
          path: 'libs/my-lib/src/../public/i18n/admin/fr.json',
          scope: 'admin',
        },
        {
          path: 'libs/my-lib/src/../public/i18n/user/en.json',
          scope: 'user',
        },
        {
          path: 'libs/my-lib/src/../public/i18n/user/fr.json',
          scope: 'user',
        },
      ]);
    });

    it('should leave scopePathMap values without ${sourceRoot} unchanged', () => {
      mockConfig = {
        scopePathMap: {
          admin: '/absolute/path/to/admin',
        },
        __sourceRoot: 'apps/my-app/src',
      };

      const result = buildScopeFilePaths({
        ...baseParams,
        langs: ['en'],
      });

      expect(result[0].path).toBe('/absolute/path/to/admin/en.json');
    });
  });
});
