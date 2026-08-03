import { describe, it, expect, vi, beforeEach } from 'vitest';

import { findMissingKeys } from '../keys-detective';
import { Config } from '../types';

vi.mock('../config', () => ({
  setConfig: vi.fn(),
  getConfig: () => ({}),
}));

vi.mock('../utils/resolve-config', () => ({
  resolveConfig: (config: any) => ({
    ...config,
    translationsPath: '/tmp/i18n',
    fileFormat: 'json',
    addMissingKeys: false,
    emitErrorOnExtraKeys: false,
    unflat: false,
  }),
}));

vi.mock('../keys-detective/get-translation-files-path', () => ({
  getTranslationFilesPath: vi.fn().mockReturnValue([]),
}));

vi.mock('../keys-builder/build-keys', () => ({
  buildKeys: vi.fn().mockReturnValue({ scopeToKeys: {} }),
}));

vi.mock('../keys-detective/compare-keys-to-files', () => ({
  compareKeysToFiles: vi.fn(),
}));

vi.mock('../utils/logger', () => ({
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
      await import('../keys-detective/get-translation-files-path');
    (getTranslationFilesPath as any).mockReturnValue(['/tmp/i18n/en.json']);

    const { buildKeys } = await import('../keys-builder/build-keys');
    const scopeToKeys = { __global: { 'some.key': 'missing' } };
    (buildKeys as any).mockReturnValue({ scopeToKeys });

    const { compareKeysToFiles } =
      await import('../keys-detective/compare-keys-to-files');

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
    });
  });
});
