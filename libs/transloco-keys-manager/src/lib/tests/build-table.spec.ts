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

const missingKey = { kind: 'N', path: ['key'], rhs: 'val' } as any;
const extraKey = { kind: 'D', path: ['old.key'], lhs: 'val' } as any;

describe('buildTable', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(getLogger().log).mockClear();
    vi.mocked(getLogger().success).mockClear();
  });

  it('given no langs, when the table is built, then it should log that no keys are missing', () => {
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

  it('given only extra keys, when the table is built, then the missing column should show "--"', () => {
    const logger = getLogger();
    const diffsPerLang = { en: { missing: [], extra: [extraKey] } };

    const result = buildTable({
      langs: ['en'],
      diffsPerLang,
      addMissingKeys: false,
    });

    expect(result).toEqual({ hasMissingKeys: false, hasExtraKeys: true });
    expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('--'));
  });

  it('given only missing keys, when the table is built, then the extra column should show "--"', () => {
    const logger = getLogger();
    const diffsPerLang = { en: { missing: [missingKey], extra: [] } };

    const result = buildTable({
      langs: ['en'],
      diffsPerLang,
      addMissingKeys: true,
    });

    expect(result).toEqual({ hasMissingKeys: true, hasExtraKeys: false });
    expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('--'));
  });

  it('given missing keys and addMissingKeys is false, when the table is built, then it should still report them', () => {
    const diffsPerLang = { en: { missing: [missingKey], extra: [] } };

    const result = buildTable({
      langs: ['en'],
      diffsPerLang,
      addMissingKeys: false,
    });

    expect(result).toEqual({ hasMissingKeys: true, hasExtraKeys: false });
  });

  /**
   * The reporting used to `process.exit(1)` before the extra keys were
   * evaluated, so both statuses must now be reported to the caller, which
   * decides on the exit code.
   */
  it('given both missing and extra keys, when the table is built, then both statuses should be reported', () => {
    const diffsPerLang = { en: { missing: [missingKey], extra: [extraKey] } };

    const result = buildTable({
      langs: ['en'],
      diffsPerLang,
      addMissingKeys: false,
    });

    expect(result).toEqual({ hasMissingKeys: true, hasExtraKeys: true });
  });

  it('given missing keys and addMissingKeys is true, when the table is built, then it should log success', () => {
    const logger = getLogger();
    const diffsPerLang = { en: { missing: [missingKey], extra: [] } };

    const result = buildTable({
      langs: ['en'],
      diffsPerLang,
      addMissingKeys: true,
    });

    expect(logger.success).toHaveBeenCalledWith(
      expect.stringContaining('Added all missing keys'),
    );
    // The status describes the diff, whether it is an error is up to the caller.
    expect(result).toEqual({ hasMissingKeys: true, hasExtraKeys: false });
  });

  it('given extra keys, when the table is built, then it should report them without any error policy', () => {
    const diffsPerLang = { en: { missing: [], extra: [extraKey] } };

    const result = buildTable({
      langs: ['en'],
      diffsPerLang,
      addMissingKeys: false,
    });

    expect(result).toEqual({ hasMissingKeys: false, hasExtraKeys: true });
  });

  it('given a lang with no differences, when the table is built, then it should be skipped', () => {
    const diffsPerLang = {
      en: { missing: [], extra: [] },
      fr: { missing: [missingKey], extra: [] },
    };

    const result = buildTable({
      langs: ['en', 'fr'],
      diffsPerLang,
      addMissingKeys: true,
    });

    expect(result).toEqual({ hasMissingKeys: true, hasExtraKeys: false });
  });
});
