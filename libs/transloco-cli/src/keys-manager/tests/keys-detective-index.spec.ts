import { describe, it, expect, vi, beforeEach } from 'vitest';

import { findMissingKeys } from '../keys-detective/index.js';
import { Config } from '../types.js';

vi.mock('../config.js', () => ({
  setConfig: vi.fn(),
  getConfig: () => ({}),
}));

vi.mock('../utils/resolve-config.js', () => ({
  resolveConfig: (config: any) => ({
    ...config,
    translationsPath: '/tmp/i18n',
    fileFormat: 'json',
    addMissingKeys: false,
    emitErrorOnExtraKeys: false,
    unflat: false,
    scopePathMap: { admin: 'libs/admin/i18n' },
  }),
}));

vi.mock('../keys-detective/get-translation-files-path.js', () => ({
  getTranslationFilesPath: vi.fn().mockReturnValue([]),
}));

vi.mock('../keys-builder/build-keys.js', () => ({
  buildKeys: vi.fn().mockReturnValue({ scopeToKeys: {} }),
}));

vi.mock('../keys-detective/compare-keys-to-files.js', () => ({
  compareKeysToFiles: vi.fn(),
}));

vi.mock('../utils/logger.js', () => ({
  getLogger: () => ({
    log: vi.fn(),
    success: vi.fn(),
    startSpinner: vi.fn(),
  }),
}));

describe('findMissingKeys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return early and log when no translation files found', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    findMissingKeys({} as Config);

    expect(consoleSpy).toHaveBeenCalledWith('No translation files found.');
    consoleSpy.mockRestore();
  });

  it('should forward the built keys and resolved config to compareKeysToFiles when translation files exist', async () => {
    const { getTranslationFilesPath } =
      await import('../keys-detective/get-translation-files-path.js');
    (getTranslationFilesPath as any).mockReturnValue(['/tmp/i18n/en.json']);

    const { buildKeys } = await import('../keys-builder/build-keys.js');
    const scopeToKeys = { __global: { 'some.key': 'missing' } };
    (buildKeys as any).mockReturnValue({ scopeToKeys });

    const { compareKeysToFiles } =
      await import('../keys-detective/compare-keys-to-files.js');

    findMissingKeys({} as Config);

    // Assert the actual data flowing through, not just that the mock fired:
    // the keys built by buildKeys and the config fields resolved upstream
    // must reach compareKeysToFiles unchanged.
    expect(compareKeysToFiles).toHaveBeenCalledWith({
      scopeToKeys,
      translationsPath: '/tmp/i18n',
      addMissingKeys: false,
      emitErrorOnExtraKeys: false,
      fileFormat: 'json',
      unflat: false,
      scopePathMap: { admin: 'libs/admin/i18n' },
    });
  });
});
