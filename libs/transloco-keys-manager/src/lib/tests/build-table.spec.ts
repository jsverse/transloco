import { describe, it, expect, vi, beforeEach } from 'vitest';

import { buildTable } from '../keys-detective/build-table';
import { getLogger } from '../utils/logger';

vi.mock('../utils/logger', () => {
  const mockLogger = {
    log: vi.fn(),
    success: vi.fn(),
    startSpinner: vi.fn(),
  };
  return { getLogger: () => mockLogger };
});

vi.mock('../keys-detective/map-diff-to-keys', () => ({
  mapDiffToKeys: vi.fn((diffs: any[]) =>
    diffs.map((d: any) => d.path?.join('.')).join(', '),
  ),
}));

describe('buildTable', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    vi.mocked(getLogger().log).mockClear();
    vi.mocked(getLogger().success).mockClear();
  });

  it('should log no missing keys when langs is empty', () => {
    const logger = getLogger();

    buildTable({
      langs: [],
      diffsPerLang: {},
      addMissingKeys: false,
      emitErrorOnExtraKeys: false,
    });

    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('No missing keys were found'),
    );
  });

  it('should display "--" for missing column when no missing keys', () => {
    const logger = getLogger();

    buildTable({
      langs: ['en'],
      diffsPerLang: {
        en: {
          missing: [],
          extra: [{ kind: 'D', path: ['unused.key'], lhs: 'val' }],
        },
      },
      addMissingKeys: false,
      emitErrorOnExtraKeys: false,
    });

    expect(process.exit).not.toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('--'));
  });

  it('should display "--" for extra column when no extra keys', () => {
    const logger = getLogger();

    buildTable({
      langs: ['en'],
      diffsPerLang: {
        en: {
          missing: [{ kind: 'N', path: ['new.key'], rhs: 'val' }],
          extra: [],
        },
      },
      addMissingKeys: true,
      emitErrorOnExtraKeys: false,
    });

    expect(process.exit).not.toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('--'));
  });

  it('should call process.exit(1) when missing keys exist and addMissingKeys is false', () => {
    const result = buildTable({
      langs: ['en'],
      diffsPerLang: {
        en: {
          missing: [{ kind: 'N', path: ['key'], rhs: 'val' }],
          extra: [],
        },
      },
      addMissingKeys: false,
      emitErrorOnExtraKeys: false,
    });

    expect(result).toEqual({ hasMissingKeys: true, hasExtraKeys: false });
  });

  it('should log success when missing keys exist and addMissingKeys is true', () => {
    const logger = getLogger();
    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => {}) as any);

    buildTable({
      langs: ['en'],
      diffsPerLang: {
        en: {
          missing: [{ kind: 'N', path: ['key'], rhs: 'val' }],
          extra: [],
        },
      },
      addMissingKeys: true,
      emitErrorOnExtraKeys: false,
    });

    expect(logger.success).toHaveBeenCalledWith(
      expect.stringContaining('Added all missing keys'),
    );
    expect(exitSpy).not.toHaveBeenCalled();
    exitSpy.mockRestore();
  });

  it('should call process.exit(2) when extra keys exist and emitErrorOnExtraKeys is true', () => {
    const result = buildTable({
      langs: ['en'],
      diffsPerLang: {
        en: {
          missing: [],
          extra: [{ kind: 'D', path: ['old.key'], lhs: 'val' }],
        },
      },
      addMissingKeys: false,
      emitErrorOnExtraKeys: true,
    });

    expect(result).toEqual({ hasMissingKeys: false, hasExtraKeys: true });
  });

  it('should skip langs with no missing and no extra keys', () => {
    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => {}) as any);

    buildTable({
      langs: ['en', 'fr'],
      diffsPerLang: {
        en: { missing: [], extra: [] },
        fr: {
          missing: [{ kind: 'N', path: ['key'], rhs: 'val' }],
          extra: [],
        },
      },
      addMissingKeys: true,
      emitErrorOnExtraKeys: false,
    });

    expect(exitSpy).not.toHaveBeenCalled();
    exitSpy.mockRestore();
  });
});
