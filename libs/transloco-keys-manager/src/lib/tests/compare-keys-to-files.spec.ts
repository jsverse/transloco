import { describe, it, expect, vi, beforeEach } from 'vitest';
import { po } from 'gettext-parser';
import fs from 'fs-extra';

import { compareKeysToFiles } from '../keys-detective/compare-keys-to-files';
import { buildTable } from '../keys-detective/build-table';
import { normalizedGlob } from '../utils/normalize-glob-path';
import { writeFile } from '../utils/file.utils';
import { getCurrentTranslation } from '../keys-builder/utils/get-current-translation';
import { getTranslationFilesPath } from '../keys-detective/get-translation-files-path';
import { setConfig } from '../config';

vi.mock('../utils/logger', () => ({
  getLogger: () => ({
    log: vi.fn(),
    success: vi.fn(),
    startSpinner: vi.fn(),
  }),
}));

vi.mock('../keys-detective/build-table', () => ({
  buildTable: vi.fn(),
}));

vi.mock('../utils/normalize-glob-path', () => ({
  normalizedGlob: vi.fn(() => []),
}));

vi.mock('../keys-detective/get-translation-files-path', () => ({
  getTranslationFilesPath: vi.fn(() => []),
}));

vi.mock('../utils/file.utils', () => ({
  readFile: vi.fn(() => ({})),
  writeFile: vi.fn(),
}));

vi.mock('fs-extra', () => ({
  default: {
    outputFileSync: vi.fn(),
  },
}));

vi.mock('../keys-builder/utils/get-current-translation', () => ({
  getCurrentTranslation: vi.fn(() => ({})),
}));

vi.mock('@jsverse/transloco-utils', () => ({
  getGlobalConfig: () => ({ scopePathMap: {} }),
}));

describe('compareKeysToFiles', () => {
  const mockBuildTable = vi.mocked(buildTable);
  const mockNormalizedGlob = vi.mocked(normalizedGlob);
  const mockGetCurrentTranslation = vi.mocked(getCurrentTranslation);
  const mockWriteFile = vi.mocked(writeFile);
  const mockGetTranslationFilesPath = vi.mocked(getTranslationFilesPath);

  beforeEach(() => {
    vi.clearAllMocks();
    mockNormalizedGlob.mockReturnValue([]);
    mockGetTranslationFilesPath.mockReturnValue([]);
    mockGetCurrentTranslation.mockReturnValue({});
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
    mockGetCurrentTranslation.mockReturnValue({ key: 'value' });
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
    mockGetCurrentTranslation.mockReturnValue({ existing: 'val' });
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
    mockGetCurrentTranslation.mockReturnValue({
      key: 'value',
      'key.comment': 'a comment',
    });
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
    mockGetCurrentTranslation.mockReturnValue({ key: 'value' });
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
    mockGetCurrentTranslation.mockReturnValue({});
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

  it('should retain existing entries and add missing keys when writing a POT file', () => {
    setConfig({ unflat: false } as any);
    mockGetTranslationFilesPath.mockReturnValue(['/tmp/i18n/en.pot']);
    mockGetCurrentTranslation.mockReturnValue({
      parent: { existing: 'existing value' },
    });
    mockNormalizedGlob.mockReturnValue(['/tmp/i18n/en.pot']);

    compareKeysToFiles({
      scopeToKeys: {
        __global: {
          'parent.existing': 'existing value',
          'parent.newKey': 'new value',
        },
      },
      translationsPath: '/tmp/i18n',
      addMissingKeys: true,
      emitErrorOnExtraKeys: false,
      fileFormat: 'pot',
      unflat: false,
    });

    const mockOutputFileSync = vi.mocked(fs.outputFileSync);
    expect(mockOutputFileSync).toHaveBeenCalledTimes(1);
    const [writtenPath, writtenContent] = mockOutputFileSync.mock.calls[0];
    expect(writtenPath).toBe('/tmp/i18n/en.pot');

    const parsed = po.parse(writtenContent as string, 'utf8');
    const entries = parsed.translations[''];
    expect(entries['parent.existing'].msgstr).toEqual(['existing value']);
    expect(entries['parent.newKey'].msgstr).toEqual(['new value']);
  });
});
