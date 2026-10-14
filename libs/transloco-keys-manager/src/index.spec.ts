import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { buildTranslationFiles, findMissingKeys } = vi.hoisted(() => ({
  buildTranslationFiles: vi.fn(),
  findMissingKeys: vi.fn(),
}));

// The option definitions and the unsupported-option warning stay real, so the
// bin is exercised against the CLI's actual exports.
vi.mock('@jsverse/transloco-cli/internal/keys-manager', async (original) => ({
  ...(await original<
    typeof import('@jsverse/transloco-cli/internal/keys-manager')
  >()),
  buildTranslationFiles,
  findMissingKeys,
}));

describe('transloco-keys-manager bin', () => {
  const originalArgv = process.argv;
  const originalNoDeprecation = process.noDeprecation;
  const notice = (replacement: string) =>
    `DeprecationWarning: transloco-keys-manager is deprecated and will be removed in Transloco v10. Run "${replacement}" from @jsverse/transloco-cli instead.\n`;
  let stderr: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    stderr = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    process.noDeprecation = false;
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.noDeprecation = originalNoDeprecation;
  });

  async function runBin(...args: string[]) {
    process.argv = ['node', 'transloco-keys-manager', ...args];
    vi.resetModules();
    await import('./index.js');
  }

  it(`GIVEN the extract command with options
      WHEN the bin runs
      THEN it hands the parsed options to the CLI's extractor`, async () => {
    await runBin(
      'extract',
      '--input',
      'src,projects/lib',
      '--langs',
      'en',
      'es',
      '--unflat',
    );

    expect(buildTranslationFiles).toHaveBeenCalledExactlyOnceWith({
      command: 'extract',
      input: ['src', 'projects/lib'],
      langs: ['en', 'es'],
      unflat: true,
    });
    expect(findMissingKeys).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it(`GIVEN the find command with options
      WHEN the bin runs
      THEN it hands the parsed options to the CLI's detective`, async () => {
    await runBin('find', '--add-missing-keys', '-p', 'i18n');

    expect(findMissingKeys).toHaveBeenCalledExactlyOnceWith({
      command: 'find',
      addMissingKeys: true,
      translationsPath: 'i18n',
    });
    expect(buildTranslationFiles).not.toHaveBeenCalled();
  });

  it(`GIVEN an option the command does not read
      WHEN the bin runs
      THEN it warns and still runs the command`, async () => {
    await runBin('find', '--replace');

    expect(console.warn).toHaveBeenCalledExactlyOnceWith(
      expect.stringContaining('--replace'),
    );
    expect(findMissingKeys).toHaveBeenCalledExactlyOnceWith({
      command: 'find',
      replace: true,
    });
  });

  it(`GIVEN no command
      WHEN the bin runs
      THEN it asks for an action and runs nothing`, async () => {
    await runBin('--input', 'src');

    expect(console.log).toHaveBeenCalledExactlyOnceWith(
      'Please provide an action...',
    );
    expect(buildTranslationFiles).not.toHaveBeenCalled();
    expect(findMissingKeys).not.toHaveBeenCalled();
  });

  it(`GIVEN the help flag
      WHEN the bin runs
      THEN it prints the usage and exits`, async () => {
    const exit = vi
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);

    await runBin('--help');

    expect(vi.mocked(console.log).mock.calls[0][0]).toContain(
      '$ transloco-keys-manager extract',
    );
    expect(exit).toHaveBeenCalledExactlyOnceWith();
  });

  it.each([
    [['extract', '--langs', 'en'], 'transloco extract'],
    [['find'], 'transloco find'],
    [['--input', 'src'], 'transloco'],
    [['translate'], 'transloco'],
  ])(
    `GIVEN the arguments %j
     WHEN the bin runs
     THEN the notice pointing to "%s" is the only thing written to stderr`,
    async (args, replacement) => {
      await runBin(...args);

      expect(stderr).toHaveBeenCalledExactlyOnceWith(notice(replacement));
    },
  );

  it(`GIVEN the extract command
      WHEN the bin runs
      THEN the notice is written before the extractor starts and stdout is untouched`, async () => {
    const stdout = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);
    buildTranslationFiles.mockImplementationOnce(() =>
      expect(stderr).toHaveBeenCalledOnce(),
    );

    await runBin('extract');

    expect(buildTranslationFiles).toHaveBeenCalledOnce();
    expect(stdout).not.toHaveBeenCalled();
    expect(console.log).not.toHaveBeenCalled();
  });

  it(`GIVEN the help flag
      WHEN the bin runs
      THEN the notice comes before the usage and the exit is the same`, async () => {
    const exit = vi
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);

    await runBin('extract', '--help');

    expect(stderr).toHaveBeenCalledExactlyOnceWith(notice('transloco extract'));
    expect(stderr.mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(console.log).mock.invocationCallOrder[0],
    );
    expect(exit).toHaveBeenCalledExactlyOnceWith();
  });

  it(`GIVEN an option the parser rejects
      WHEN the bin runs
      THEN the notice is written and the error still escapes`, async () => {
    await expect(runBin('extract', '--bogus')).rejects.toThrow('--bogus');

    expect(stderr).toHaveBeenCalledExactlyOnceWith(notice('transloco extract'));
    expect(buildTranslationFiles).not.toHaveBeenCalled();
  });

  it(`GIVEN deprecation warnings are turned off
      WHEN the bin runs
      THEN no notice is written and the command still runs`, async () => {
    process.noDeprecation = true;

    await runBin('find');

    expect(stderr).not.toHaveBeenCalled();
    expect(findMissingKeys).toHaveBeenCalledExactlyOnceWith({
      command: 'find',
    });
  });
});
