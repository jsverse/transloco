import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const validator = vi.hoisted(() => vi.fn());

vi.mock('@jsverse/transloco-cli/internal/validator', () => ({
  default: validator,
}));

describe('transloco-validator bin', () => {
  const originalArgv = process.argv;
  const originalNoDeprecation = process.noDeprecation;
  const notice =
    'DeprecationWarning: transloco-validator is deprecated and will be removed in Transloco v10. Run "transloco validate" from @jsverse/transloco-cli instead.\n';
  let stderr: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    stderr = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    process.noDeprecation = false;
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.noDeprecation = originalNoDeprecation;
  });

  async function runBin(...args: string[]) {
    process.argv = ['node', 'transloco-validator', ...args];
    vi.resetModules();
    await import('./index.js');
  }

  it(`GIVEN translation file paths as arguments
      WHEN the bin runs
      THEN it validates exactly those paths with the CLI's validator`, async () => {
    await runBin('i18n/en.json', 'i18n/es.json');

    expect(validator).toHaveBeenCalledExactlyOnceWith([
      'i18n/en.json',
      'i18n/es.json',
    ]);
  });

  it(`GIVEN no arguments
      WHEN the bin runs
      THEN it validates an empty list`, async () => {
    await runBin();

    expect(validator).toHaveBeenCalledExactlyOnceWith([]);
  });

  it(`GIVEN translation file paths as arguments
      WHEN the bin runs
      THEN the notice is the only thing written to stderr, before the validator starts`, async () => {
    const stdout = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);
    validator.mockImplementationOnce(() =>
      expect(stderr).toHaveBeenCalledOnce(),
    );

    await runBin('i18n/en.json');

    expect(validator).toHaveBeenCalledOnce();
    expect(stderr).toHaveBeenCalledExactlyOnceWith(notice);
    expect(stdout).not.toHaveBeenCalled();
  });

  it(`GIVEN a validator that fails
      WHEN the bin runs
      THEN the notice is written and the error still escapes`, async () => {
    validator.mockImplementationOnce(() => {
      throw new Error('Found duplicate keys');
    });

    await expect(runBin('i18n/en.json')).rejects.toThrow(
      'Found duplicate keys',
    );

    expect(stderr).toHaveBeenCalledExactlyOnceWith(notice);
  });

  it(`GIVEN deprecation warnings are turned off
      WHEN the bin runs
      THEN no notice is written and the files are still validated`, async () => {
    process.noDeprecation = true;

    await runBin('i18n/en.json');

    expect(stderr).not.toHaveBeenCalled();
    expect(validator).toHaveBeenCalledExactlyOnceWith(['i18n/en.json']);
  });
});
