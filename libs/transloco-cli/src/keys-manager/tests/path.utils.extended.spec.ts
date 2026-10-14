import { describe, it, expect, vi } from 'vitest';

import {
  getScopeAndLangFromPath,
  resolveConfigPaths,
} from '../utils/path.utils';
import { Config } from '../types';

vi.mock('../config', () => ({
  getConfig: () => ({
    scopePathMap: {},
    __sourceRoot: '',
  }),
}));

describe('path.utils - getScopeAndLangFromPath', () => {
  it('should extract scope and lang from a scoped path', () => {
    const result = getScopeAndLangFromPath({
      filePath: '/project/src/assets/i18n/admin/en.json',
      translationsPath: '/project/src/assets/i18n',
      fileFormat: 'json',
    });
    expect(result).toEqual({ scope: 'admin', lang: 'en' });
  });

  it('should extract lang without scope from a root-level path', () => {
    const result = getScopeAndLangFromPath({
      filePath: '/project/src/assets/i18n/en.json',
      translationsPath: '/project/src/assets/i18n',
      fileFormat: 'json',
    });
    expect(result).toEqual({ scope: undefined, lang: 'en' });
  });

  it('should handle nested scope paths', () => {
    const result = getScopeAndLangFromPath({
      filePath: '/project/i18n/admin/nested/en.json',
      translationsPath: '/project/i18n',
      fileFormat: 'json',
    });
    expect(result).toEqual({ scope: 'admin/nested', lang: 'en' });
  });

  it('should handle translationsPath without trailing slash', () => {
    const result = getScopeAndLangFromPath({
      filePath: '/project/i18n/fr.json',
      translationsPath: '/project/i18n',
      fileFormat: 'json',
    });
    expect(result).toEqual({ scope: undefined, lang: 'fr' });
  });

  it('should handle pot file format', () => {
    const result = getScopeAndLangFromPath({
      filePath: '/project/i18n/en.pot',
      translationsPath: '/project/i18n',
      fileFormat: 'pot',
    });
    expect(result).toEqual({ scope: undefined, lang: 'en' });
  });
});

describe('path.utils - resolveConfigPaths', () => {
  it('should resolve config paths with sourceRoot interpolation', () => {
    const config = {
      input: ['${sourceRoot}/app'],
      output: '${sourceRoot}/i18n',
      translationsPath: '${sourceRoot}/i18n',
      __sourceRoot: 'src',
    } as unknown as Config;

    resolveConfigPaths(config);

    expect(config.input[0].replace(/\\/g, '/')).toContain('src/app');
    expect(config.output.replace(/\\/g, '/')).toContain('src/i18n');
    expect(config.translationsPath.replace(/\\/g, '/')).toContain('src/i18n');
  });

  it('should resolve config paths without sourceRoot', () => {
    const config = {
      input: ['app'],
      output: 'i18n',
      translationsPath: 'i18n',
      __sourceRoot: '',
    } as unknown as Config;

    resolveConfigPaths(config);

    expect(config.input[0]).toContain('app');
    expect(config.output).toContain('i18n');
  });
});
