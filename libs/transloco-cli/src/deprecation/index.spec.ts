import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type LegacyBin, warnDeprecatedBin } from './index.js';

describe('warnDeprecatedBin', () => {
  const originalNoDeprecation = process.noDeprecation;
  let write: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    process.noDeprecation = false;
    write = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    process.noDeprecation = originalNoDeprecation;
    vi.restoreAllMocks();
  });

  it.each([
    ['transloco-validator', undefined, 'transloco validate'],
    ['transloco-optimize', undefined, 'transloco optimize'],
    ['transloco-scoped-libs', undefined, 'transloco scoped-libs'],
    ['transloco-keys-manager', 'extract', 'transloco extract'],
    ['transloco-keys-manager', 'find', 'transloco find'],
    ['transloco-keys-manager', undefined, 'transloco'],
    ['transloco-keys-manager', '--help', 'transloco'],
    ['transloco-keys-manager', 'translate', 'transloco'],
    ['transloco-validator', 'extract', 'transloco validate'],
  ] as const)(
    `GIVEN the bin "%s" started with "%s"
     WHEN it warns
     THEN stderr gets the notice naming "%s" as the replacement, on one line`,
    (bin: LegacyBin, command: string | undefined, replacement: string) => {
      warnDeprecatedBin(bin, command);

      expect(write).toHaveBeenCalledExactlyOnceWith(
        `DeprecationWarning: ${bin} is deprecated and will be removed in Transloco v10. Run "${replacement}" from @jsverse/transloco-cli instead.\n`,
      );
    },
  );

  it(`GIVEN deprecation warnings are turned off
      WHEN a bin warns
      THEN nothing is written`, () => {
    process.noDeprecation = true;

    warnDeprecatedBin('transloco-keys-manager', 'extract');
    warnDeprecatedBin('transloco-validator');

    expect(write).not.toHaveBeenCalled();
  });

  it(`GIVEN a warning
      WHEN it is written
      THEN stdout is left alone`, () => {
    const stdout = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);

    warnDeprecatedBin('transloco-optimize');

    expect(stdout).not.toHaveBeenCalled();
  });
});
