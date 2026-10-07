import { writeFileSync } from 'node:fs';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    writeFileSync: vi.fn(),
  };
});

vi.mock('../utils/file.utils', () => ({
  readFile: vi.fn(() => '{"key": "value"}'),
}));

const mockWriteFileSync = vi.mocked(writeFileSync);

describe('runPrettier', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should format files when prettier is available and config exists', async () => {
    vi.doMock('prettier', () => ({
      resolveConfig: vi.fn().mockResolvedValue({ semi: true }),
      format: vi.fn().mockResolvedValue('{ "key": "value" }\n'),
    }));

    const { runPrettier } = await import('../keys-builder/utils/run-prettier');
    await runPrettier(['/path/to/file.json']);

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      '/path/to/file.json',
      '{ "key": "value" }\n',
    );
  });

  it('should not format files when prettier config is null', async () => {
    vi.doMock('prettier', () => ({
      resolveConfig: vi.fn().mockResolvedValue(null),
      format: vi.fn(),
    }));

    const { runPrettier } = await import('../keys-builder/utils/run-prettier');
    await runPrettier(['/path/to/file.json']);

    expect(mockWriteFileSync).not.toHaveBeenCalled();
  });

  it('should silently handle MODULE_NOT_FOUND error', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.doMock('prettier', () => {
      const err = new Error('Cannot find module') as any;
      err.code = 'MODULE_NOT_FOUND';
      return {
        resolveConfig: () => {
          throw err;
        },
        format: vi.fn(),
      };
    });

    const { runPrettier } = await import('../keys-builder/utils/run-prettier');
    await runPrettier(['/path/to/file.json']);

    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should warn on non-MODULE_NOT_FOUND errors', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.doMock('prettier', () => ({
      resolveConfig: vi.fn().mockRejectedValue(new Error('Unexpected error')),
      format: vi.fn(),
    }));

    const { runPrettier } = await import('../keys-builder/utils/run-prettier');
    await runPrettier(['/path/to/file.json']);

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to run prettier',
      'Unexpected error',
    );
    consoleSpy.mockRestore();
  });

  it('should format multiple files', async () => {
    vi.doMock('prettier', () => ({
      resolveConfig: vi.fn().mockResolvedValue({ semi: true }),
      format: vi.fn().mockResolvedValue('formatted'),
    }));

    const { runPrettier } = await import('../keys-builder/utils/run-prettier');
    await runPrettier(['/path/a.json', '/path/b.json']);

    expect(mockWriteFileSync).toHaveBeenCalledTimes(2);
    expect(mockWriteFileSync).toHaveBeenCalledWith('/path/a.json', 'formatted');
    expect(mockWriteFileSync).toHaveBeenCalledWith('/path/b.json', 'formatted');
  });
});
