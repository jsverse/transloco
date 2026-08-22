import { describe, it, expect, vi, beforeEach } from 'vitest';

import { compareKeysToFiles } from '../keys-detective/compare-keys-to-files';
import { buildTable } from '../keys-detective/build-table';
import { normalizedGlob } from '../utils/normalize-glob-path';
import { writeFile } from '../utils/file.utils';
import { getCurrentTranslation } from '../keys-builder/utils/get-current-translation';
import { getTranslationFilesPath } from '../keys-detective/get-translation-files-path';

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
  writeFile: vi.fn(),
}));

vi.mock('../keys-builder/utils/get-current-translation', () => ({
  getCurrentTranslation: vi.fn(() => ({})),
}));

let unflat = false;
vi.mock('../config', () => ({
  getConfig: () => ({ unflat, sort: false }),
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
    unflat = false;
    mockNormalizedGlob.mockReturnValue([]);
    mockGetTranslationFilesPath.mockReturnValue([]);
    mockGetCurrentTranslation.mockReturnValue({});
  });

  it('should call buildTable with empty langs when no translation files', () => {
    compareKeysToFiles({
      scopeToKeys: { __global: { key: 'value' } },
      translationsPath: '/tmp/i18n',
      addMissingKeys: false,
      fileFormat: 'json',
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
      fileFormat: 'json',
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
      fileFormat: 'json',
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
      fileFormat: 'json',
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
      fileFormat: 'json',
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
    unflat = true;
    mockGetTranslationFilesPath.mockReturnValue(['/tmp/i18n/en.json']);
    mockGetCurrentTranslation.mockReturnValue({});
    mockNormalizedGlob.mockReturnValue(['/tmp/i18n/en.json']);

    compareKeysToFiles({
      scopeToKeys: { __global: { 'a.b': 'value' } },
      translationsPath: '/tmp/i18n',
      addMissingKeys: true,
      fileFormat: 'json',
    });

    const [, content] = mockWriteFile.mock.calls[0];
    expect(JSON.parse(content as string)).toEqual({ a: { b: 'value' } });
  });

  /**
   * The translation files used to be read with `JSON.parse` and written back as
   * JSON, so `find --file-format pot` crashed on the first `.pot` file.
   */
  describe('when the file format is pot', () => {
    it('should parse the translation files as pot', () => {
      mockGetTranslationFilesPath.mockReturnValue(['/tmp/i18n/en.pot']);
      mockGetCurrentTranslation.mockReturnValue({ 'existing.key': 'Existing' });
      mockNormalizedGlob.mockReturnValue(['/tmp/i18n/en.pot']);

      compareKeysToFiles({
        scopeToKeys: {
          __global: { 'existing.key': 'Existing', 'missing.key': '' },
        },
        translationsPath: '/tmp/i18n',
        addMissingKeys: false,
        fileFormat: 'pot',
      });

      expect(mockGetCurrentTranslation).toHaveBeenCalledWith({
        path: '/tmp/i18n/en.pot',
        fileFormat: 'pot',
      });
      expect(mockBuildTable).toHaveBeenCalledWith(
        expect.objectContaining({
          diffsPerLang: expect.objectContaining({
            en: expect.objectContaining({
              missing: [expect.objectContaining({ path: ['missing.key'] })],
            }),
          }),
        }),
      );
    });

    it('should write the missing keys back as pot', () => {
      mockGetTranslationFilesPath.mockReturnValue(['/tmp/i18n/en.pot']);
      mockGetCurrentTranslation.mockReturnValue({ 'existing.key': 'Existing' });
      mockNormalizedGlob.mockReturnValue(['/tmp/i18n/en.pot']);

      compareKeysToFiles({
        scopeToKeys: {
          __global: { 'existing.key': 'Existing', 'missing.key': '' },
        },
        translationsPath: '/tmp/i18n',
        addMissingKeys: true,
        fileFormat: 'pot',
      });

      const [path, content] = mockWriteFile.mock.calls[0];
      expect(path).toBe('/tmp/i18n/en.pot');
      expect(content).toEqual(expect.stringContaining('msgid "missing.key"'));
      expect(content).toEqual(expect.stringContaining('msgid "existing.key"'));
    });
  });
});
