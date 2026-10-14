import { describe, it, expect, vi, beforeEach } from 'vitest';

import { compareKeysToFiles } from '../keys-detective/compare-keys-to-files.js';
import { buildTable } from '../keys-detective/build-table.js';
import { normalizedGlob } from '../utils/normalize-glob-path.js';
import { readFile, writeFile } from '../utils/file.utils.js';
import { getTranslationFilesPath } from '../keys-detective/get-translation-files-path.js';

vi.mock('../utils/logger.js', () => ({
  getLogger: () => ({
    log: vi.fn(),
    success: vi.fn(),
    startSpinner: vi.fn(),
  }),
}));

vi.mock('../keys-detective/build-table.js', () => ({
  buildTable: vi.fn(),
}));

vi.mock('../utils/normalize-glob-path.js', () => ({
  normalizedGlob: vi.fn(() => []),
}));

vi.mock('../keys-detective/get-translation-files-path.js', () => ({
  getTranslationFilesPath: vi.fn(() => []),
}));

vi.mock('../utils/file.utils.js', () => ({
  readFile: vi.fn(() => ({})),
  writeFile: vi.fn(),
}));

vi.mock('../../config/index.js', () => ({
  getGlobalConfig: () => ({ scopePathMap: {} }),
}));

describe('compareKeysToFiles', () => {
  const mockBuildTable = vi.mocked(buildTable);
  const mockNormalizedGlob = vi.mocked(normalizedGlob);
  const mockReadFile = vi.mocked(readFile);
  const mockWriteFile = vi.mocked(writeFile);
  const mockGetTranslationFilesPath = vi.mocked(getTranslationFilesPath);

  beforeEach(() => {
    vi.clearAllMocks();
    mockNormalizedGlob.mockReturnValue([]);
    mockGetTranslationFilesPath.mockReturnValue([]);
    mockReadFile.mockImplementation(((path: string, opts?: any) => {
      if (opts?.parse) return {};
      return '{}';
    }) as any);
  });

  it('should call buildTable with empty langs when no translation files', () => {
    compareKeysToFiles({
      scopeToKeys: { __global: { key: 'value' } },
      translationsPath: '/tmp/i18n',
      addMissingKeys: false,
      emitErrorOnExtraKeys: false,
      fileFormat: 'json',
      unflat: false,
    });

    expect(mockBuildTable).toHaveBeenCalledWith(
      expect.objectContaining({ langs: [] }),
    );
  });

  it('should skip duplicate scopes via cache', () => {
    mockGetTranslationFilesPath.mockReturnValue([
      '/tmp/i18n/en.json',
      '/tmp/i18n/fr.json',
    ]);
    mockReadFile.mockImplementation(((path: string, opts?: any) => {
      if (opts?.parse) return { key: 'value' };
      return '{"key":"value"}';
    }) as any);
    mockNormalizedGlob.mockReturnValue(['/tmp/i18n/en.json']);

    compareKeysToFiles({
      scopeToKeys: { __global: { key: 'value' } },
      translationsPath: '/tmp/i18n',
      addMissingKeys: false,
      emitErrorOnExtraKeys: false,
      fileFormat: 'json',
      unflat: false,
    });

    // normalizedGlob called only once for __global scope (second file same scope = cached)
    expect(mockNormalizedGlob).toHaveBeenCalledTimes(1);
  });

  it('should detect missing keys and add them when addMissingKeys is true', () => {
    mockGetTranslationFilesPath.mockReturnValue(['/tmp/i18n/en.json']);
    mockReadFile.mockImplementation(((path: string, opts?: any) => {
      if (opts?.parse) return { existing: 'val' };
      return '{"existing":"val"}';
    }) as any);
    mockNormalizedGlob.mockReturnValue(['/tmp/i18n/en.json']);

    compareKeysToFiles({
      scopeToKeys: { __global: { existing: 'val', newKey: 'new' } },
      translationsPath: '/tmp/i18n',
      addMissingKeys: true,
      emitErrorOnExtraKeys: false,
      fileFormat: 'json',
      unflat: false,
    });

    expect(mockWriteFile).toHaveBeenCalled();
    expect(mockBuildTable).toHaveBeenCalledWith(
      expect.objectContaining({
        addMissingKeys: true,
      }),
    );
  });

  it('should exclude comment deletions from extra keys', () => {
    mockGetTranslationFilesPath.mockReturnValue(['/tmp/i18n/en.json']);
    mockReadFile.mockImplementation(((path: string, opts?: any) => {
      if (opts?.parse) return { key: 'value', 'key.comment': 'a comment' };
      return '{}';
    }) as any);
    mockNormalizedGlob.mockReturnValue(['/tmp/i18n/en.json']);

    compareKeysToFiles({
      scopeToKeys: { __global: { key: 'value' } },
      translationsPath: '/tmp/i18n',
      addMissingKeys: false,
      emitErrorOnExtraKeys: false,
      fileFormat: 'json',
      unflat: false,
    });

    expect(mockBuildTable).toHaveBeenCalledWith(
      expect.objectContaining({
        diffsPerLang: expect.objectContaining({
          en: expect.objectContaining({
            extra: [],
          }),
        }),
      }),
    );
  });

  it('should namespace missing keys under the scope path (e.g. admin/en) for scoped translation files', () => {
    mockGetTranslationFilesPath.mockReturnValue(['/tmp/i18n/admin/en.json']);
    mockReadFile.mockImplementation(((path: string, opts?: any) => {
      if (opts?.parse) return { key: 'value' };
      return '{"key":"value"}';
    }) as any);
    mockNormalizedGlob.mockReturnValue(['/tmp/i18n/admin/en.json']);

    compareKeysToFiles({
      scopeToKeys: {
        __global: {},
        admin: { key: 'value', newKey: 'new' },
      },
      translationsPath: '/tmp/i18n',
      addMissingKeys: false,
      emitErrorOnExtraKeys: false,
      fileFormat: 'json',
      unflat: false,
    });

    // Scoped diffs must be keyed as `<scope>/<lang>` (not the global `<lang>`
    // key), and must contain the actual missing key detected for that scope.
    expect(mockBuildTable).toHaveBeenCalledWith(
      expect.objectContaining({
        langs: ['admin/en'],
        diffsPerLang: expect.objectContaining({
          'admin/en': expect.objectContaining({
            missing: [expect.objectContaining({ path: ['newKey'] })],
            extra: [],
          }),
        }),
      }),
    );
  });

  it('should unflatten translation before writing when unflat is true', () => {
    mockGetTranslationFilesPath.mockReturnValue(['/tmp/i18n/en.json']);
    mockReadFile.mockImplementation(((path: string, opts?: any) => {
      if (opts?.parse) return {};
      return '{}';
    }) as any);
    mockNormalizedGlob.mockReturnValue(['/tmp/i18n/en.json']);

    compareKeysToFiles({
      scopeToKeys: { __global: { 'a.b': 'value' } },
      translationsPath: '/tmp/i18n',
      addMissingKeys: true,
      emitErrorOnExtraKeys: false,
      fileFormat: 'json',
      unflat: true,
    });

    expect(mockWriteFile).toHaveBeenCalledWith(
      '/tmp/i18n/en.json',
      expect.objectContaining({ a: { b: 'value' } }),
    );
  });
});
