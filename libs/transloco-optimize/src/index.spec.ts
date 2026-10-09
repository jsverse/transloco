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

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    optimizeFiles.mockResolvedValue(undefined);
  });

  afterEach(() => {
    process.argv = originalArgv;
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
});
