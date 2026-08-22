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
    vi.mocked(getLogger().log).mockClear();
    vi.mocked(getLogger().success).mockClear();
  });

  it('should log no missing keys when langs is empty', () => {
    const logger = getLogger();

    const result = buildTable({
      langs: [],
      diffsPerLang: {},
      addMissingKeys: false,
    });

    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('No missing keys were found'),
    );
    expect(result).toEqual({ hasMissingKeys: false, hasExtraKeys: false });
  });

  it('should display "--" for missing column when no missing keys', () => {
    const logger = getLogger();

    const result = buildTable({
      langs: ['en'],
      diffsPerLang: {
        en: {
          missing: [],
          extra: [{ kind: 'D', path: ['unused.key'], lhs: 'val' }],
        },
      },
      addMissingKeys: false,
    });

    expect(result).toEqual({ hasMissingKeys: false, hasExtraKeys: true });
    expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('--'));
  });

  it('should display "--" for extra column when no extra keys', () => {
    const logger = getLogger();

    const result = buildTable({
      langs: ['en'],
      diffsPerLang: {
        en: {
          missing: [{ kind: 'N', path: ['new.key'], rhs: 'val' }],
          extra: [],
        },
      },
      addMissingKeys: true,
    });

    expect(result).toEqual({ hasMissingKeys: true, hasExtraKeys: false });
    expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('--'));
  });

  it('should report missing keys regardless of addMissingKeys', () => {
    const result = buildTable({
      langs: ['en'],
      diffsPerLang: {
        en: {
          missing: [{ kind: 'N', path: ['key'], rhs: 'val' }],
          extra: [],
        },
      },
      addMissingKeys: false,
    });

    expect(result).toEqual({ hasMissingKeys: true, hasExtraKeys: false });
  });

  /**
   * The reporting used to `process.exit(1)` before the extra keys were
   * evaluated, so both statuses must now be reported to the caller, which
   * decides on the exit code.
   */
  it('should report both statuses when missing and extra keys exist', () => {
    const result = buildTable({
      langs: ['en'],
      diffsPerLang: {
        en: {
          missing: [{ kind: 'N', path: ['key'], rhs: 'val' }],
          extra: [{ kind: 'D', path: ['old.key'], lhs: 'val' }],
        },
      },
      addMissingKeys: false,
    });

    expect(result).toEqual({ hasMissingKeys: true, hasExtraKeys: true });
  });

  it('should log success when missing keys exist and addMissingKeys is true', () => {
    const logger = getLogger();

    const result = buildTable({
      langs: ['en'],
      diffsPerLang: {
        en: {
          missing: [{ kind: 'N', path: ['key'], rhs: 'val' }],
          extra: [],
        },
      },
      addMissingKeys: true,
    });

    expect(logger.success).toHaveBeenCalledWith(
      expect.stringContaining('Added all missing keys'),
    );
    // The status describes the diff, whether it is an error is up to the caller.
    expect(result).toEqual({ hasMissingKeys: true, hasExtraKeys: false });
  });

  it('should report extra keys regardless of emitErrorOnExtraKeys', () => {
    const result = buildTable({
      langs: ['en'],
      diffsPerLang: {
        en: {
          missing: [],
          extra: [{ kind: 'D', path: ['old.key'], lhs: 'val' }],
        },
      },
      addMissingKeys: false,
    });

    expect(result).toEqual({ hasMissingKeys: false, hasExtraKeys: true });
  });

  it('should skip langs with no missing and no extra keys', () => {
    const result = buildTable({
      langs: ['en', 'fr'],
      diffsPerLang: {
        en: { missing: [], extra: [] },
        fr: {
          missing: [{ kind: 'N', path: ['key'], rhs: 'val' }],
          extra: [],
        },
      },
      addMissingKeys: true,
    });

    expect(result).toEqual({ hasMissingKeys: true, hasExtraKeys: false });
  });
});
