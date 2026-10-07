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

  beforeEach(() => {
    vi.clearAllMocks();
    getGlobalConfig.mockReturnValue({
      rootTranslationsPath: 'src/assets/i18n',
      scopedLibs: ['libs/core'],
      langs: ['en'],
    });
  });

  afterEach(() => {
    process.argv = originalArgv;
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
});
