import { describe, it, expect, vi, beforeEach } from 'vitest';

import { createTranslationFiles } from '../keys-builder/create-translation-files';
import { runPrettier } from '../keys-builder/utils/run-prettier';
import { getLogger } from '../utils/logger';
import { buildTranslationFile } from '../keys-builder/build-translation-file';
import { ScopeMap } from '../types';

vi.mock('../utils/logger', () => {
  const mockLogger = {
    log: vi.fn(),
    success: vi.fn(),
    startSpinner: vi.fn(),
  };
  return { getLogger: () => mockLogger };
});

vi.mock('../config', () => ({
  getConfig: () => ({ scopePathMap: {}, __sourceRoot: '' }),
}));

vi.mock('../keys-builder/utils/run-prettier', () => ({
  runPrettier: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../keys-builder/build-translation-file', () => ({
  buildTranslationFile: vi.fn(),
}));

describe('createTranslationFiles', () => {
  const mockBuildTranslationFile = vi.mocked(buildTranslationFile);
  const mockRunPrettier = vi.mocked(runPrettier);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should log created files when new files exist', async () => {
    const logger = getLogger();

    mockBuildTranslationFile.mockReturnValue({
      type: 'new',
      path: '/output/en.json',
    });

    await createTranslationFiles({
      scopeToKeys: { __global: { key: 'val' } } as ScopeMap,
      langs: ['en'],
      output: '/output',
      replace: false,
      removeExtraKeys: false,
      scopes: { aliasToScope: {} },
      fileFormat: 'json',
    } as any);

    expect(logger.success).toHaveBeenCalledWith(
      expect.stringContaining('Created the following translation files'),
    );
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('/output/en.json'),
    );
  });

  it('should not log created files message when all files are merged', async () => {
    const logger = getLogger();

    mockBuildTranslationFile.mockReturnValue({
      type: 'modified',
      path: '/output/en.json',
    });

    await createTranslationFiles({
      scopeToKeys: { __global: { key: 'val' } } as ScopeMap,
      langs: ['en'],
      output: '/output',
      replace: false,
      removeExtraKeys: false,
      scopes: { aliasToScope: {} },
      fileFormat: 'json',
    } as any);

    expect(logger.success).not.toHaveBeenCalledWith(
      expect.stringContaining('Created the following translation files'),
    );
  });

  it('should call runPrettier for json format', async () => {
    mockBuildTranslationFile.mockReturnValue({
      type: 'new',
      path: '/output/en.json',
    });

    await createTranslationFiles({
      scopeToKeys: { __global: { key: 'val' } } as ScopeMap,
      langs: ['en'],
      output: '/output',
      replace: false,
      removeExtraKeys: false,
      scopes: { aliasToScope: {} },
      fileFormat: 'json',
    } as any);

    expect(mockRunPrettier).toHaveBeenCalled();
  });

  it('should not call runPrettier for pot format', async () => {
    mockBuildTranslationFile.mockReturnValue({
      type: 'new',
      path: '/output/en.pot',
    });

    await createTranslationFiles({
      scopeToKeys: { __global: { key: 'val' } } as ScopeMap,
      langs: ['en'],
      output: '/output',
      replace: false,
      removeExtraKeys: false,
      scopes: { aliasToScope: {} },
      fileFormat: 'pot',
    } as any);

    expect(mockRunPrettier).not.toHaveBeenCalled();
  });

  it('should build translation files for scoped keys', async () => {
    mockBuildTranslationFile.mockReturnValue({
      type: 'new',
      path: '/output/admin/en.json',
    });

    await createTranslationFiles({
      scopeToKeys: {
        __global: { key: 'val' },
        admin: { adminKey: 'adminVal' },
      } as ScopeMap,
      langs: ['en'],
      output: '/output',
      replace: false,
      removeExtraKeys: false,
      scopes: { aliasToScope: { admin: 'admin' } },
      fileFormat: 'json',
    } as any);

    // Called for global + scope
    expect(mockBuildTranslationFile).toHaveBeenCalledTimes(2);
  });
});
