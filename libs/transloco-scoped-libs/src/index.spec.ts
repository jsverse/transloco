import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getGlobalConfig, run } = vi.hoisted(() => ({
  getGlobalConfig: vi.fn(),
  run: vi.fn(),
}));

vi.mock('@jsverse/transloco-cli', () => ({ getGlobalConfig }));
vi.mock('@jsverse/transloco-cli/internal/scoped-libs', () => ({
  default: run,
}));

describe('transloco-scoped-libs bin', () => {
  const originalArgv = process.argv;
  const originalNoDeprecation = process.noDeprecation;
  const notice =
    'DeprecationWarning: transloco-scoped-libs is deprecated and will be removed in Transloco v10. Run "transloco scoped-libs" from @jsverse/transloco-cli instead.\n';
  let stderr: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    getGlobalConfig.mockReturnValue({
      rootTranslationsPath: 'src/assets/i18n',
      scopedLibs: ['libs/core'],
      langs: ['en'],
    });
    stderr = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    process.noDeprecation = false;
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.noDeprecation = originalNoDeprecation;
  });

  async function runBin(...args: string[]) {
    process.argv = ['node', 'transloco-scoped-libs', ...args];
    vi.resetModules();
    await import('./index.js');
  }

  it(`GIVEN no flags
      WHEN the bin runs
      THEN it runs the CLI's scoped libs once with the global config`, async () => {
    await runBin();

    expect(getGlobalConfig).toHaveBeenCalledExactlyOnceWith();
    expect(run).toHaveBeenCalledExactlyOnceWith({
      watch: false,
      skipGitIgnoreUpdate: false,
      rootTranslationsPath: 'src/assets/i18n',
      scopedLibs: ['libs/core'],
    });
  });

  it(`GIVEN the watch and skip-gitignore flags
      WHEN the bin runs
      THEN it forwards both to the CLI's scoped libs`, async () => {
    await runBin('--watch', '--skip-gitignore');

    expect(run).toHaveBeenCalledExactlyOnceWith({
      watch: true,
      skipGitIgnoreUpdate: true,
      rootTranslationsPath: 'src/assets/i18n',
      scopedLibs: ['libs/core'],
    });
  });

  it(`GIVEN the short flag aliases
      WHEN the bin runs
      THEN they map to watch and skip-gitignore`, async () => {
    await runBin('-w', '-m');

    expect(run).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ watch: true, skipGitIgnoreUpdate: true }),
    );
  });

  it(`GIVEN no flags
      WHEN the bin runs
      THEN the notice is the only thing written to stderr, before the config is read`, async () => {
    const stdout = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);
    getGlobalConfig.mockImplementationOnce(() => {
      expect(stderr).toHaveBeenCalledOnce();

      return { rootTranslationsPath: 'src/assets/i18n', scopedLibs: [] };
    });

    await runBin();

    expect(run).toHaveBeenCalledOnce();
    expect(stderr).toHaveBeenCalledExactlyOnceWith(notice);
    expect(stdout).not.toHaveBeenCalled();
  });

  it(`GIVEN a config that cannot be read
      WHEN the bin runs
      THEN the notice is written and the error still escapes`, async () => {
    getGlobalConfig.mockImplementationOnce(() => {
      throw new Error('Invalid config');
    });

    await expect(runBin()).rejects.toThrow('Invalid config');

    expect(stderr).toHaveBeenCalledExactlyOnceWith(notice);
    expect(run).not.toHaveBeenCalled();
  });

  it(`GIVEN deprecation warnings are turned off
      WHEN the bin runs
      THEN no notice is written and the scoped libs still run`, async () => {
    process.noDeprecation = true;

    await runBin();

    expect(stderr).not.toHaveBeenCalled();
    expect(run).toHaveBeenCalledOnce();
  });
});
