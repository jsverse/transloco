import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const validator = vi.hoisted(() => vi.fn());

vi.mock('@jsverse/transloco-cli/internal/validator', () => ({
  default: validator,
}));

describe('transloco-validator bin', () => {
  const originalArgv = process.argv;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.argv = originalArgv;
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
});
