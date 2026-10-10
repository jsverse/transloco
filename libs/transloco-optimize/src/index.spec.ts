import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getTranslationFiles, getTranslationsFolder, optimizeFiles } =
  vi.hoisted(() => ({
    getTranslationFiles: vi.fn(),
    getTranslationsFolder: vi.fn(),
    optimizeFiles: vi.fn(),
  }));

vi.mock('@jsverse/transloco-cli/internal/optimize', () => ({
  getTranslationFiles,
  getTranslationsFolder,
  optimizeFiles,
}));

describe('transloco-optimize bin', () => {
  const originalArgv = process.argv;
  const originalNoDeprecation = process.noDeprecation;
  const notice =
    'DeprecationWarning: transloco-optimize is deprecated and will be removed in Transloco v10. Run "transloco optimize" from @jsverse/transloco-cli instead.\n';
  let stderr: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    optimizeFiles.mockResolvedValue(undefined);
    stderr = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    process.noDeprecation = false;
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.noDeprecation = originalNoDeprecation;
  });

  async function runBin(...args: string[]) {
    process.argv = ['node', 'transloco-optimize', ...args];
    vi.resetModules();
    await import('./index.js');
  }

  it(`GIVEN a dist folder and a comments key
      WHEN the bin runs
      THEN it optimizes the files the CLI found with that key`, async () => {
    getTranslationFiles.mockResolvedValue(['dist/en.json', 'dist/es.json']);

    await runBin('dist/i18n', '--commentsKey', 'note');

    await vi.waitFor(() =>
      expect(console.log).toHaveBeenCalledWith('Transloco Optimize: Done! 🎊 '),
    );
    expect(getTranslationFiles).toHaveBeenCalledExactlyOnceWith('dist/i18n');
    expect(optimizeFiles).toHaveBeenCalledExactlyOnceWith(
      ['dist/en.json', 'dist/es.json'],
      'note',
    );
    expect(console.warn).not.toHaveBeenCalled();
  });

  it(`GIVEN only a dist folder
      WHEN the bin runs
      THEN it falls back to the default comments key`, async () => {
    getTranslationFiles.mockResolvedValue(['dist/en.json']);

    await runBin('--dist', 'dist/i18n');

    await vi.waitFor(() =>
      expect(optimizeFiles).toHaveBeenCalledExactlyOnceWith(
        ['dist/en.json'],
        'comment',
      ),
    );
  });

  it(`GIVEN a dist folder without translation files
      WHEN the bin runs
      THEN it warns with the resolved folder and optimizes nothing`, async () => {
    getTranslationFiles.mockResolvedValue([]);
    getTranslationsFolder.mockReturnValue('/abs/dist/i18n');

    await runBin('dist/i18n');

    await vi.waitFor(() =>
      expect(console.warn).toHaveBeenCalledExactlyOnceWith(
        'Transloco Optimize: No Translation path found under: /abs/dist/i18n',
      ),
    );
    expect(getTranslationsFolder).toHaveBeenCalledExactlyOnceWith('dist/i18n');
    expect(optimizeFiles).not.toHaveBeenCalled();
  });

  it(`GIVEN a dist folder
      WHEN the bin runs
      THEN the notice is the only thing written to stderr, before the files are looked up`, async () => {
    const stdout = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);
    getTranslationFiles.mockImplementationOnce(() => {
      expect(stderr).toHaveBeenCalledOnce();

      return Promise.resolve(['dist/en.json']);
    });

    await runBin('dist/i18n');

    await vi.waitFor(() =>
      expect(console.log).toHaveBeenCalledWith('Transloco Optimize: Done! 🎊 '),
    );
    expect(stderr).toHaveBeenCalledExactlyOnceWith(notice);
    expect(stdout).not.toHaveBeenCalled();
  });

  it(`GIVEN a dist folder without translation files
      WHEN the bin runs
      THEN the notice is written and the warning goes to console.warn as before`, async () => {
    getTranslationFiles.mockResolvedValue([]);
    getTranslationsFolder.mockReturnValue('/abs/dist/i18n');

    await runBin('dist/i18n');

    await vi.waitFor(() => expect(console.warn).toHaveBeenCalledOnce());
    expect(stderr).toHaveBeenCalledExactlyOnceWith(notice);
  });

  it(`GIVEN deprecation warnings are turned off
      WHEN the bin runs
      THEN no notice is written and the files are still optimized`, async () => {
    process.noDeprecation = true;
    getTranslationFiles.mockResolvedValue(['dist/en.json']);

    await runBin('dist/i18n');

    await vi.waitFor(() =>
      expect(optimizeFiles).toHaveBeenCalledExactlyOnceWith(
        ['dist/en.json'],
        'comment',
      ),
    );
    expect(stderr).not.toHaveBeenCalled();
  });
});
